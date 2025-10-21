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
        self, goal: str, extra_context: Optional[Dict[str, str]]
    ) -> str:
        """Build input text with context."""
        input_parts = [f"Create a comprehensive career plan for: {goal}"]

        if extra_context:
            if extra_context.get("student_background"):
                input_parts.append(
                    f"Background: {extra_context['student_background']}"
                )
            if extra_context.get("degree_level"):
                input_parts.append(f"Academic level: {extra_context['degree_level']}")
            if extra_context.get("courses_taken"):
                input_parts.append(
                    f"Courses completed: {extra_context['courses_taken']}"
                )
            if extra_context.get("time_commitment"):
                input_parts.append(
                    f"Available time: {extra_context['time_commitment']}"
                )

        return "\n".join(input_parts)

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
        result = {"agent": agent_label}

        if "orchestrationTrace" in trace_data:
            orch = trace_data["orchestrationTrace"]

            # Reasoning
            if "rationale" in orch and orch["rationale"].get("text"):
                result["reasoning"] = orch["rationale"]["text"]

            # Collaborator invocation
            if "invocationInput" in orch:
                inv = orch["invocationInput"]
                if inv.get("invocationType") == "AGENT_COLLABORATOR":
                    collab_input = inv.get("agentCollaboratorInvocationInput", {})
                    result["calling_collaborator"] = collab_input.get(
                        "agentCollaboratorName"
                    )
                    result["input_text"] = collab_input.get("input", {}).get("text")

            # Collaborator response
            if "observation" in orch:
                obs = orch["observation"]
                if obs.get("type") == "AGENT_COLLABORATOR":
                    collab_output = obs.get("agentCollaboratorInvocationOutput", {})
                    result["collaborator_response"] = {
                        "agent": collab_output.get("agentCollaboratorName"),
                        "output": collab_output.get("output", {}).get("text"),
                    }

        return result

    async def invoke_supervisor_stream(
        self,
        goal: str,
        session_id: str,
        extra_context: Optional[Dict[str, str]] = None,
    ) -> AsyncIterator[Dict]:
        """Stream supervisor agent response as async generator."""
        input_text = self._build_input_text(goal, extra_context)

        logger.info(f"Invoking AgentCore supervisor for session {session_id}")

        # Create async Bedrock client
        async with self.session.client(
            "bedrock-agent-runtime", region_name=self.region
        ) as runtime_client:

            response = await runtime_client.invoke_agent(
                agentId=self.planner_id,
                agentAliasId=self.planner_alias_id,
                sessionId=session_id,
                inputText=input_text,
                enableTrace=True,
            )

            chunk_count = 0
            trace_count = 0

            # ASYNC iteration - no blocking!
            async for event in response["completion"]:
                if "chunk" in event:
                    text = event["chunk"]["bytes"].decode("utf-8")
                    chunk_count += 1
                    logger.debug(f"AgentCore CHUNK #{chunk_count}")
                    yield {"type": "chunk", "text": text, "session_id": session_id}

                elif "trace" in event:
                    trace_count += 1
                    trace_data = self._parse_trace_event(event)
                    logger.debug(f"AgentCore TRACE #{trace_count}")
                    yield {
                        "type": "trace",
                        "data": trace_data,
                        "session_id": session_id,
                    }

            logger.info(f"Stream completed: {chunk_count} chunks, {trace_count} traces")
