#!/usr/bin/env python3
"""
test_agentcore_workflow.py
Tests the multi-agent career planning workflow with AgentCore
"""

import boto3
import os
import json
from dotenv import load_dotenv

load_dotenv()

runtime_client = boto3.client(
    "bedrock-agent-runtime", region_name=os.getenv("AWS_REGION", "us-east-1")
)

PLANNER_ID = os.getenv("AGENTCORE_PLANNER_AGENT_ID")
PLANNER_ALIAS_ID = os.getenv("AGENTCORE_PLANNER_ALIAS_ID")
JOB_AGENT_ID = os.getenv("AGENTCORE_JOB_AGENT_ID")
JOB_ALIAS_ID = os.getenv("AGENTCORE_JOB_ALIAS_ID")
COURSE_AGENT_ID = os.getenv("AGENTCORE_COURSE_AGENT_ID")
COURSE_ALIAS_ID = os.getenv("AGENTCORE_COURSE_ALIAS_ID")
PROJECT_AGENT_ID = os.getenv("AGENTCORE_PROJECT_AGENT_ID")
PROJECT_ALIAS_ID = os.getenv("AGENTCORE_PROJECT_ALIAS_ID")


def invoke_supervisor(goal, session_id):
    """Invoke supervisor agent (it will coordinate sub-agents automatically)"""

    print(f"\n→ Invoking CareerPlannerAgent (supervisor)")
    print(f"   Goal: {goal}")
    print(f"   Session: {session_id}\n")

    response = runtime_client.invoke_agent(
        agentId=PLANNER_ID,
        agentAliasId=PLANNER_ALIAS_ID,
        sessionId=session_id,
        inputText=f"Create a career plan for a UTD student with this goal: {goal}",
        enableTrace=True,
    )

    full_response = ""

    # Lambda functions are invoked automatically by Bedrock - no manual tool handling needed!
    for event in response["completion"]:
        if "chunk" in event:
            # Agent's text response
            chunk = event["chunk"]
            if "bytes" in chunk:
                text = chunk["bytes"].decode("utf-8")
                full_response += text
                print(text, end="", flush=True)

        elif "trace" in event:
            # Enhanced trace information for debugging multi-agent collaboration
            trace_part = event["trace"]
            trace = trace_part.get("trace", {})

            # Get agent/collaborator context
            agent_id = trace_part.get("agentId", "unknown")
            collaborator_name = trace_part.get("collaboratorName")
            caller_chain = trace_part.get("callerChain", [])

            # Determine if this is supervisor or collaborator
            is_collaborator = collaborator_name is not None
            agent_label = (
                f"COLLABORATOR: {collaborator_name}"
                if is_collaborator
                else "SUPERVISOR"
            )

            # Show orchestration traces (reasoning, invocations, observations)
            if "orchestrationTrace" in trace:
                orch_trace = trace["orchestrationTrace"]

                # 1. Show agent/subagent reasoning
                if "rationale" in orch_trace:
                    rationale = orch_trace["rationale"]
                    if rationale and rationale.get("text"):
                        reasoning_text = rationale["text"]
                        print(
                            f"\n{'='*60}\n[{agent_label} REASONING]\n{reasoning_text}\n{'='*60}",
                            flush=True,
                        )

                # 2. Show subagent invocation (calls to collaborators)
                if "invocationInput" in orch_trace:
                    invocation = orch_trace["invocationInput"]
                    invocation_type = invocation.get("invocationType")

                    if invocation_type == "AGENT_COLLABORATOR":
                        collab_input = invocation.get(
                            "agentCollaboratorInvocationInput", {}
                        )
                        collab_name = collab_input.get(
                            "agentCollaboratorName", "unknown"
                        )
                        collab_arn = collab_input.get(
                            "agentCollaboratorAliasArn", "N/A"
                        )
                        input_text = collab_input.get("input", {}).get("text", "N/A")

                        print(
                            f"\n{'='*60}\n[CALLING COLLABORATOR: {collab_name}]\n"
                            f"Input: {input_text}\n"
                            f"ARN: {collab_arn}\n{'='*60}",
                            flush=True,
                        )

                # 3. Show subagent response (observation from collaborators)
                if "observation" in orch_trace:
                    observation = orch_trace["observation"]
                    obs_type = observation.get("type")

                    if obs_type == "AGENT_COLLABORATOR":
                        collab_output = observation.get(
                            "agentCollaboratorInvocationOutput", {}
                        )
                        collab_name = collab_output.get(
                            "agentCollaboratorName", "unknown"
                        )
                        output_text = collab_output.get("output", {}).get("text", "N/A")

                        print(
                            f"\n{'='*60}\n[COLLABORATOR RESPONSE: {collab_name}]\n"
                            f"{output_text}\n{'='*60}",
                            flush=True,
                        )
                    elif obs_type == "ACTION_GROUP":
                        action_output = observation.get(
                            "actionGroupInvocation", {}
                        ).get("text", "N/A")
                        print(
                            f"\n[{agent_label} - ACTION GROUP OUTPUT]\n{action_output[:200]}...",
                            flush=True,
                        )
                    elif obs_type == "KNOWLEDGE_BASE":
                        kb_output = observation.get("knowledgeBaseLookupOutput", {})
                        num_refs = len(kb_output.get("retrievedReferences", []))
                        print(
                            f"\n[{agent_label} - KNOWLEDGE BASE]\nRetrieved {num_refs} references",
                            flush=True,
                        )

    print(f"\n\n{'='*60}")
    print("WORKFLOW COMPLETE")
    print("=" * 60)

    return full_response


def main():
    session_id = "test-session-001"
    goal = "I want to become a data scientist"

    print("\n" + "=" * 60)
    print("Testing AgentCore Multi-Agent Collaboration")
    print("=" * 60)
    print(f"\nGoal: {goal}")
    print(f"Session ID: {session_id}")

    if not PLANNER_ID or not PLANNER_ALIAS_ID:
        print("\n❌ Error: Agent IDs not found in environment")
        print("   Please run setup_agentcore_agents.py first and add IDs to .env")
        return

    print(f"\nPlanner Agent ID: {PLANNER_ID}")
    print(f"Planner Alias ID: {PLANNER_ALIAS_ID}")

    try:
        final_plan = invoke_supervisor(goal, session_id)

        print("\n\n" + "=" * 60)
        print("WORKFLOW COMPLETE")
        print("=" * 60)
        print(f"\nFinal plan length: {len(final_plan)} characters")

        if final_plan:
            print("\n✅ SUCCESS: Agent collaboration workflow completed")
        else:
            print("\n⚠️  WARNING: Empty response received")

    except Exception as e:
        print(f"\n\n❌ Error during workflow execution:")
        print(f"   {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
