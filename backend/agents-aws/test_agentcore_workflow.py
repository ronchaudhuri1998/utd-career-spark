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
            # Optional: Log trace information for debugging
            trace = event["trace"]["trace"]

            # Show when collaborator agents are invoked
            if "agentCollaboratorInvocationOutput" in trace:
                collab = trace["agentCollaboratorInvocationOutput"]
                print(
                    f"\n[COLLABORATOR: {collab.get('agentCollaboratorName', 'unknown')}]",
                    flush=True,
                )

            # Show agent's reasoning
            if "orchestrationTrace" in trace:
                orch_trace = trace["orchestrationTrace"]
                if "rationale" in orch_trace:
                    rationale = orch_trace["rationale"]
                    if rationale and rationale.get("text"):
                        print(
                            f"\n[AGENT REASONING: {rationale['text'][:100]}...]",
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
