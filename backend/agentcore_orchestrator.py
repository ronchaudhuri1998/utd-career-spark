"""AWS Bedrock AgentCore orchestrator for career planning workflow."""

import aioboto3
import os
import logging
import asyncio
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
        self.collaborator_invocation_counts = {}
        self.action_group_invocations = {}  # Track action group calls by traceId

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

    def _parse_trace_event(self, event: Dict, session_id: str) -> Dict:
        """Extract useful info from trace event."""
        trace_part = event.get("trace", {})
        trace_data = trace_part.get("trace", {})
        
        # Log raw trace_part keys to see what's available
        logger.info(f"Trace part keys: {list(trace_part.keys())}")
        logger.info(f"Trace data keys: {list(trace_data.keys())}")

        # Extract agent/collaborator info
        collaborator_name = trace_part.get("collaboratorName")
        agent_label = (
            f"Collaborator: {collaborator_name}" if collaborator_name else "Supervisor"
        )

        # Create a unique ID for this supervisor session
        # All subagent calls will use the same supervisor_id
        supervisor_id = f"supervisor_{session_id}"

        # Extract reasoning, invocations, observations
        result = {
            "agent": agent_label,
            "status": "progress",
            "supervisor_id": supervisor_id,  # Add supervisor ID for grouping
        }  # Default status

        # Add agent_call_id for all collaborator traces
        if (
            collaborator_name
            and collaborator_name in self.collaborator_invocation_counts
        ):
            count = self.collaborator_invocation_counts[collaborator_name]
            result["agent_call_id"] = f"{session_id}_{collaborator_name}_{count}"

        # Check for failure traces first
        if "failureTrace" in trace_data:
            failure = trace_data["failureTrace"]
            result["status"] = "failed"
            result["failure_reason"] = failure.get("failureReason", "Unknown error")
            logger.error(f"Agent failed: {result['failure_reason']}")
            return result

        if "orchestrationTrace" in trace_data:
            orch = trace_data["orchestrationTrace"]
            
            # Log all available fields in orchestrationTrace
            logger.info(f"OrchestrationTrace keys: {list(orch.keys())}")

            # Reasoning
            if "rationale" in orch and orch["rationale"].get("text"):
                result["reasoning"] = orch["rationale"]["text"]
                result["status"] = "progress"  # Reasoning indicates work in progress

            # Collaborator invocation
            if "invocationInput" in orch:
                inv = orch["invocationInput"]
                if inv.get("invocationType") == "AGENT_COLLABORATOR":
                    collab_input = inv.get("agentCollaboratorInvocationInput", {})
                    collab_name = collab_input.get("agentCollaboratorName")

                    # Generate unique call ID for this collaborator invocation
                    count = self.collaborator_invocation_counts.get(collab_name, 0) + 1
                    self.collaborator_invocation_counts[collab_name] = count
                    result["agent_call_id"] = f"{session_id}_{collab_name}_{count}"

                    result["calling_collaborator"] = collab_name
                    result["input_text"] = collab_input.get("input", {}).get("text")
                    result["status"] = "started"  # Collaborator invocation started

                elif inv.get("invocationType") == "ACTION_GROUP":
                    # Handle action group invocation input
                    action_input = inv.get("actionGroupInvocationInput", {})
                    trace_id = inv.get("traceId")
                    
                    if trace_id and action_input:
                        # Extract action group details
                        action_group_name = action_input.get("actionGroupName", "Unknown Action Group")
                        function_name = action_input.get("function", "Unknown Function")
                        api_path = action_input.get("apiPath", "")
                        verb = action_input.get("verb", "")
                        execution_type = action_input.get("executionType", "LAMBDA")
                        
                        # Convert parameters array to dict for easier frontend display
                        parameters = {}
                        param_list = action_input.get("parameters", [])
                        for param in param_list:
                            if isinstance(param, dict) and "name" in param and "value" in param:
                                parameters[param["name"]] = param["value"]
                        
                        # Store invocation details for later matching with observation
                        self.action_group_invocations[trace_id] = {
                            "actionGroupName": action_group_name,
                            "function": function_name,
                            "apiPath": api_path,
                            "verb": verb,
                            "executionType": execution_type,
                            "parameters": parameters,
                            "sessionId": session_id
                        }
                        
                        # Create tool call entry with "calling" status
                        result["tool_calls"] = result.get("tool_calls", [])
                        result["tool_calls"].append({
                            "type": "action_group",
                            "name": action_group_name,
                            "function": function_name,
                            "status": "calling",
                            "parameters": parameters,
                            "api_path": api_path,
                            "verb": verb,
                            "trace_id": trace_id
                        })
                        
                        logger.info(f"Action group invocation started: {action_group_name}.{function_name} (traceId: {trace_id})")

                elif inv.get("invocationType") == "KNOWLEDGE_BASE":
                    # Handle knowledge base lookup input
                    kb_input = inv.get("knowledgeBaseLookupInput", {})
                    trace_id = inv.get("traceId")
                    
                    if trace_id and kb_input:
                        kb_id = kb_input.get("knowledgeBaseId", "unknown")
                        query_text = kb_input.get("text", "")
                        
                        # Store KB invocation details
                        self.action_group_invocations[trace_id] = {
                            "knowledgeBaseId": kb_id,
                            "query": query_text,
                            "sessionId": session_id
                        }
                        
                        # Create tool call entry
                        result["tool_calls"] = result.get("tool_calls", [])
                        result["tool_calls"].append({
                            "type": "knowledge_base",
                            "name": kb_id.replace("_", " ").title(),
                            "status": "calling",
                            "query": query_text,
                            "trace_id": trace_id
                        })
                        
                        logger.info(f"Knowledge base lookup started: {kb_id} (traceId: {trace_id})")

            # Collaborator response
            if "observation" in orch:
                obs = orch["observation"]
                if obs.get("type") == "AGENT_COLLABORATOR":
                    collab_output = obs.get("agentCollaboratorInvocationOutput", {})
                    collab_name = collab_output.get("agentCollaboratorName")

                    result["collaborator_response"] = {
                        "agent": collab_name,
                        "output": collab_output.get("output", {}).get("text"),
                    }
                    result["status"] = "completed"  # Collaborator response received

                    # Add agent_call_id for the completed collaborator
                    if (
                        collab_name
                        and collab_name in self.collaborator_invocation_counts
                    ):
                        count = self.collaborator_invocation_counts[collab_name]
                        result["agent_call_id"] = f"{session_id}_{collab_name}_{count}"

                # Tool/Action Group invocations
                elif obs.get("type") == "ACTION_GROUP":
                    # Debug: log the full observation structure
                    logger.info(f"ACTION_GROUP observation: {obs}")

                    # AWS Bedrock uses actionGroupInvocationOutput (not actionGroupInvocation)
                    action_inv = obs.get("actionGroupInvocationOutput", {})
                    trace_id = obs.get("traceId")
                    
                    result["tool_calls"] = result.get("tool_calls", [])
                    
                    # Look up stored invocation details by traceId
                    if trace_id and trace_id in self.action_group_invocations:
                        stored_invocation = self.action_group_invocations[trace_id]
                        
                        # Extract output details
                        output_text = action_inv.get("text", "")
                        metadata = action_inv.get("metadata", {})
                        execution_time_ms = metadata.get("totalTimeMs")
                        client_request_id = metadata.get("clientRequestId")
                        
                        # Create completed tool call entry with all details
                        tool_call = {
                            "type": "action_group",
                            "name": stored_invocation["actionGroupName"],
                            "function": stored_invocation["function"],
                            "status": "completed",
                            "parameters": stored_invocation["parameters"],
                            "api_path": stored_invocation["apiPath"],
                            "verb": stored_invocation["verb"],
                            "trace_id": trace_id,
                            "result": f"Completed {stored_invocation['actionGroupName']}.{stored_invocation['function']}"
                        }
                        
                        # Add optional fields if available
                        if execution_time_ms is not None:
                            tool_call["execution_time_ms"] = execution_time_ms
                        if client_request_id:
                            tool_call["client_request_id"] = client_request_id
                        if output_text:
                            tool_call["response"] = output_text
                        
                        result["tool_calls"].append(tool_call)
                        
                        # Clean up stored invocation
                        del self.action_group_invocations[trace_id]
                        
                        logger.info(f"Action group completed: {stored_invocation['actionGroupName']}.{stored_invocation['function']} (traceId: {trace_id}, time: {execution_time_ms}ms)")
                    else:
                        # Fallback to old inference method if traceId not found
                        output_text = action_inv.get("text", "")
                        
                        # Try to infer tool type from output content
                        if "job" in output_text.lower() or "hiring" in output_text.lower():
                            display_name = "Job Market Tools"
                        elif (
                            "course" in output_text.lower() or "cs " in output_text.lower()
                        ):
                            display_name = "Course Catalog Tools"
                        elif (
                            "project" in output_text.lower()
                            or "github" in output_text.lower()
                        ):
                            display_name = "Project Tools"
                        elif (
                            "nebula" in output_text.lower()
                            or "professor" in output_text.lower()
                        ):
                            display_name = "Nebula API Tools"
                        else:
                            display_name = "Lambda Tool"

                        result["tool_calls"].append(
                            {
                                "type": "action_group",
                                "name": display_name,
                                "status": "completed",
                                "result": f"Completed {display_name}",
                            }
                        )

                # Knowledge Base lookups
                elif obs.get("type") == "KNOWLEDGE_BASE":
                    # Debug: log the full observation structure
                    logger.info(f"KNOWLEDGE_BASE observation: {obs}")

                    kb_output = obs.get("knowledgeBaseLookupOutput", {})
                    trace_id = obs.get("traceId")
                    
                    result["tool_calls"] = result.get("tool_calls", [])
                    
                    # Look up stored KB invocation details by traceId
                    if trace_id and trace_id in self.action_group_invocations:
                        stored_invocation = self.action_group_invocations[trace_id]
                        
                        # Extract output details
                        metadata = kb_output.get("metadata", {})
                        execution_time_ms = metadata.get("totalTimeMs")
                        client_request_id = metadata.get("clientRequestId")
                        retrieved_references = kb_output.get("retrievedReferences", [])
                        
                        # Create completed KB tool call entry
                        tool_call = {
                            "type": "knowledge_base",
                            "name": stored_invocation["knowledgeBaseId"].replace("_", " ").title(),
                            "status": "completed",
                            "query": stored_invocation["query"],
                            "trace_id": trace_id,
                            "result": f"Retrieved {len(retrieved_references)} references from {stored_invocation['knowledgeBaseId']}"
                        }
                        
                        # Add optional fields if available
                        if execution_time_ms is not None:
                            tool_call["execution_time_ms"] = execution_time_ms
                        if client_request_id:
                            tool_call["client_request_id"] = client_request_id
                        if retrieved_references:
                            tool_call["references_count"] = len(retrieved_references)
                        
                        result["tool_calls"].append(tool_call)
                        
                        # Clean up stored invocation
                        del self.action_group_invocations[trace_id]
                        
                        logger.info(f"Knowledge base lookup completed: {stored_invocation['knowledgeBaseId']} (traceId: {trace_id}, time: {execution_time_ms}ms, refs: {len(retrieved_references)})")
                    else:
                        # Fallback to old method if traceId not found
                        raw_kb_name = (
                            kb_output.get("knowledgeBaseName")
                            or kb_output.get("knowledgeBaseId")
                            or "knowledge_base"
                        )

                        # Map knowledge base names to more user-friendly display names
                        kb_display_names = {
                            "knowledge_base": "Knowledge Base",
                            "course_catalog": "Course Catalog",
                            "academic_database": "Academic Database",
                        }

                        display_name = kb_display_names.get(
                            raw_kb_name, raw_kb_name.replace("_", " ").title()
                        )

                        result["tool_calls"].append(
                            {
                                "type": "knowledge_base",
                                "name": display_name,
                                "status": "completed",
                                "result": f"Completed {display_name}",
                            }
                        )

        return result

    async def invoke_supervisor_stream(
        self,
        goal: str,
        session_id: str,
        user_context: Optional[Dict[str, str]] = None,
    ) -> AsyncIterator[Dict]:
        """Stream supervisor agent response as async generator."""
        # Reset invocation counts for new request
        self.collaborator_invocation_counts = {}
        self.action_group_invocations = {}  # Reset action group tracking

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

            # Add retry logic with exponential backoff for throttling
            max_retries = 3
            base_delay = 1
            
            for attempt in range(max_retries):
                try:
                    response = await runtime_client.invoke_agent(**invoke_params)
                    break
                except Exception as e:
                    if "throttlingException" in str(e) and attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt)
                        logger.warning(f"Throttling detected, retrying in {delay} seconds (attempt {attempt + 1}/{max_retries})")
                        await asyncio.sleep(delay)
                        continue
                    else:
                        raise

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
                    
                    # Log the RAW trace event for debugging
                    logger.info(
                        f"AgentCore TRACE #{trace_count} RAW: {event.get('trace', {})}"
                    )
                    
                    trace_data = self._parse_trace_event(event, session_id)
                    logger.info(
                        f"AgentCore TRACE #{trace_count}: Full trace data: {trace_data}"
                    )

                    # Only yield traces that have meaningful content
                    # Skip empty progress traces that have no reasoning, collaborator calls, or responses
                    has_content = (
                        "reasoning" in trace_data
                        or "calling_collaborator" in trace_data
                        or "collaborator_response" in trace_data
                        or "tool_calls" in trace_data
                    )

                    if has_content:
                        yield {
                            "type": "trace",
                            "data": trace_data,
                            "session_id": session_id,
                        }

            logger.info(f"Stream completed: {chunk_count} chunks, {trace_count} traces")
