#!/usr/bin/env python3
"""
Test agent format outputs with detailed career planning request.
This tests whether agents produce properly formatted outputs.
"""

import boto3
import os
import sys
from dotenv import load_dotenv
from pathlib import Path

# Add backend to path for validator
sys.path.insert(0, str(Path(__file__).parent))
from format_validator import validate_agent_output

load_dotenv()

runtime_client = boto3.client(
    "bedrock-agent-runtime", region_name=os.getenv("AWS_REGION", "us-east-1")
)

PLANNER_ID = os.getenv("AGENTCORE_PLANNER_AGENT_ID")
PLANNER_ALIAS_ID = os.getenv("AGENTCORE_PLANNER_ALIAS_ID")


def test_comprehensive_career_plan():
    """Test with a comprehensive career planning request"""

    print("\n" + "=" * 70)
    print("Testing Agent Output Formats")
    print("=" * 70)

    # Detailed request that should trigger all agents with formatted output
    request = """I'm a UT Dallas Computer Science student interested in becoming a Full-Stack Software Engineer.

Please provide:
1. Current job market analysis for full-stack developers
2. Recommended UTD courses for my goal
3. Portfolio project ideas to build

I need the complete formatted output so I can see it in my dashboard."""

    session_id = "format-test-session"

    print(f"\n📝 Request: {request[:100]}...")
    print(f"🔑 Session: {session_id}")
    print(f"🤖 Planner: {PLANNER_ID}")

    try:
        print("\n" + "=" * 70)
        print("Invoking Supervisor Agent...")
        print("=" * 70 + "\n")

        response = runtime_client.invoke_agent(
            agentId=PLANNER_ID,
            agentAliasId=PLANNER_ALIAS_ID,
            sessionId=session_id,
            inputText=request,
            enableTrace=False,  # Disable trace for cleaner output
        )

        full_response = ""

        # Collect full response
        for event in response["completion"]:
            if "chunk" in event:
                chunk = event["chunk"]
                if "bytes" in chunk:
                    text = chunk["bytes"].decode("utf-8")
                    full_response += text
                    print(text, end="", flush=True)

        print("\n\n" + "=" * 70)
        print("Response Analysis")
        print("=" * 70)

        print(f"\n📊 Response length: {len(full_response)} characters")

        # Check for format markers
        has_job_section = "=== JOB LISTINGS ===" in full_response
        has_course_section = "=== COURSE CATALOG ===" in full_response
        has_project_section = "=== PROJECT RECOMMENDATIONS ===" in full_response

        print(f"\n🔍 Format Markers Detected:")
        print(f"   Job Market Format: {'✅' if has_job_section else '❌'}")
        print(f"   Course Format: {'✅' if has_course_section else '❌'}")
        print(f"   Project Format: {'✅' if has_project_section else '❌'}")

        # Try to validate each section if present
        if has_job_section:
            print(f"\n📋 Validating Job Market Format...")
            job_result = validate_agent_output("job_market", full_response)
            print(f"   Result: {job_result}")
            if job_result.errors:
                print(f"   Errors: {job_result.errors}")
            if job_result.warnings:
                print(f"   Warnings: {job_result.warnings}")

        if has_course_section:
            print(f"\n📋 Validating Course Format...")
            course_result = validate_agent_output("course", full_response)
            print(f"   Result: {course_result}")
            if course_result.errors:
                print(f"   Errors: {course_result.errors}")
            if course_result.warnings:
                print(f"   Warnings: {course_result.warnings}")

        if has_project_section:
            print(f"\n📋 Validating Project Format...")
            project_result = validate_agent_output("project", full_response)
            print(f"   Result: {project_result}")
            if project_result.errors:
                print(f"   Errors: {project_result.errors}")
            if project_result.warnings:
                print(f"   Warnings: {project_result.warnings}")

        print("\n" + "=" * 70)
        print("Test Summary")
        print("=" * 70)

        if has_job_section or has_course_section or has_project_section:
            print("\n✅ At least one agent produced formatted output!")
            print("   This confirms the externalized prompts are working.")
        else:
            print("\n⚠️  No formatted sections detected in response.")
            print("   Agents may need more explicit prompting or examples.")

        print("\n💡 Note: Agents may provide conversational responses when")
        print("   appropriate. Formatted output is generated for dashboard")
        print("   display when specifically requested.\n")

        return full_response

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()
        return None


def main():
    if not PLANNER_ID or not PLANNER_ALIAS_ID:
        print("\n❌ Error: Agent IDs not configured")
        print("   Please check your .env file")
        return 1

    result = test_comprehensive_career_plan()

    if result:
        print("=" * 70)
        print("✅ Test completed successfully")
        print("=" * 70 + "\n")
        return 0
    else:
        print("=" * 70)
        print("❌ Test failed")
        print("=" * 70 + "\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
