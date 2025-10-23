"""AWS Bedrock AgentCore orchestrator for career planning workflow."""

import aioboto3
import os
import logging
from typing import Dict, AsyncIterator, Optional
from dotenv import load_dotenv

# Configure logging for orchestrator
logger = logging.getLogger(__name__)

load_dotenv()


class AgentCoreOrchestrator:
    """Async wrapper around AWS Bedrock AgentCore runtime for career planning."""

    def __init__(self):
        self.region = os.getenv("AWS_REGION", "us-east-1")
        self.planner_id = os.getenv("AGENTCORE_PLANNER_AGENT_ID")
        self.planner_alias_id = os.getenv("AGENTCORE_PLANNER_ALIAS_ID")
        self.session = aioboto3.Session()

    def _build_input_text(
        self, goal: str, user_context: Optional[Dict[str, str]] = None
    ) -> str:
        """Build input text with user context for the agent."""
        # Start with user context if provided
        if user_context:
            context_parts = []

            # Add user profile info
            if user_context.get("user_name"):
                context_parts.append(f"Student Name: {user_context['user_name']}")
            if user_context.get("user_major"):
                context_parts.append(f"Major: {user_context['user_major']}")
            if user_context.get("graduation_year"):
                context_parts.append(
                    f"Expected Graduation: {user_context['graduation_year']}"
                )
            if user_context.get("skills"):
                context_parts.append(f"Current Skills: {user_context['skills']}")

            # Build message with context
            context_str = "\n".join(context_parts)
            return f"{context_str}\n\nStudent Request: {goal}"

        return f"Create a comprehensive career plan for: {goal}"

    def _build_session_attributes(self, user_context: Dict[str, str]) -> Dict[str, str]:
        """Build sessionAttributes from user context."""
        return {
            "user_name": user_context.get("user_name") or "",
            "user_email": user_context.get("user_email") or "",
            "user_phone": user_context.get("user_phone") or "",
            "user_location": user_context.get("user_location") or "",
            "user_major": user_context.get("user_major") or "",
            "graduation_year": user_context.get("graduation_year") or "",
            "gpa": user_context.get("gpa") or "",
            "career_goal": user_context.get("career_goal") or "",
            "bio": user_context.get("bio") or "",
            "student_year": user_context.get("student_year") or "",
            "courses_taken": user_context.get("courses_taken") or "",
            "time_commitment": user_context.get("time_commitment") or "",
            "skills": user_context.get("skills") or "",
            "experience": user_context.get("experience") or "",
        }

    def _parse_trace_event(self, event: Dict) -> Dict:
        """Extract useful info from trace event."""
        trace_part = event.get("trace", {})
        trace_data = trace_part.get("trace", {})

        # Extract agent/collaborator info
        collaborator_name = trace_part.get("collaboratorName")
        agent_label = (
            f"Collaborator: {collaborator_name}" if collaborator_name else "Supervisor"
        )

        # Extract reasoning, invocations, observations
        result = {"agent": agent_label, "status": "progress"}  # Default status

        if "orchestrationTrace" in trace_data:
            orch = trace_data["orchestrationTrace"]

            # Reasoning
            if "rationale" in orch and orch["rationale"].get("text"):
                result["reasoning"] = orch["rationale"]["text"]
                result["status"] = "progress"  # Reasoning indicates work in progress

            # Collaborator invocation
            if "invocationInput" in orch:
                inv = orch["invocationInput"]
                if inv.get("invocationType") == "AGENT_COLLABORATOR":
                    collab_input = inv.get("agentCollaboratorInvocationInput", {})
                    result["calling_collaborator"] = collab_input.get(
                        "agentCollaboratorName"
                    )
                    result["input_text"] = collab_input.get("input", {}).get("text")
                    result["status"] = "started"  # Collaborator invocation started

            # Collaborator response
            if "observation" in orch:
                obs = orch["observation"]
                if obs.get("type") == "AGENT_COLLABORATOR":
                    collab_output = obs.get("agentCollaboratorInvocationOutput", {})
                    result["collaborator_response"] = {
                        "agent": collab_output.get("agentCollaboratorName"),
                        "output": collab_output.get("output", {}).get("text"),
                    }
                    result["status"] = "completed"  # Collaborator response received

        return result

    async def invoke_supervisor_stream(
        self,
        goal: str,
        session_id: str,
        user_context: Optional[Dict[str, str]] = None,
    ) -> AsyncIterator[Dict]:
        """Stream supervisor agent response as async generator."""
        input_text = self._build_input_text(goal, user_context)

        logger.info(f"Invoking AgentCore supervisor for session {session_id}")

        # Create async Bedrock client
        async with self.session.client(
            "bedrock-agent-runtime", region_name=self.region
        ) as runtime_client:

            # Prepare invoke_agent parameters
            invoke_params = {
                "agentId": self.planner_id,
                "agentAliasId": self.planner_alias_id,
                "sessionId": session_id,
                "inputText": input_text,
                "enableTrace": True,
            }

            response = await runtime_client.invoke_agent(**invoke_params)

            chunk_count = 0
            trace_count = 0

            # ASYNC iteration - no blocking!
            async for event in response["completion"]:
                if "chunk" in event:
                    text = event["chunk"]["bytes"].decode("utf-8")
                    chunk_count += 1
                    yield {"type": "chunk", "text": text, "session_id": session_id}

                elif "trace" in event:
                    trace_count += 1
                    trace_data = self._parse_trace_event(event)
                    logger.info(
                        f"AgentCore TRACE #{trace_count}: Full trace data: {trace_data}"
                    )
                    yield {
                        "type": "trace",
                        "data": trace_data,
                        "session_id": session_id,
                    }

            logger.info(f"Stream completed: {chunk_count} chunks, {trace_count} traces")
