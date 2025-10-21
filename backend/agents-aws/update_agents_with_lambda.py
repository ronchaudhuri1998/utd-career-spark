#!/usr/bin/env python3
"""
Update JobMarketAgent to use Lambda function instead of RETURN_CONTROL
"""

import boto3
import os
import time
from dotenv import load_dotenv

load_dotenv()

control_client = boto3.client(
    "bedrock-agent", region_name=os.getenv("AWS_REGION", "us-east-1")
)

# Get environment variables
JOB_AGENT_ID = os.getenv("AGENTCORE_JOB_AGENT_ID")
LAMBDA_ARN = os.getenv("LAMBDA_JOB_MARKET_TOOLS_ARN")

if not JOB_AGENT_ID:
    print("❌ Error: AGENTCORE_JOB_AGENT_ID not found in .env")
    exit(1)

if not LAMBDA_ARN:
    print("❌ Error: LAMBDA_JOB_MARKET_TOOLS_ARN not found in .env")
    print("Please add to .env:")
    print(
        "LAMBDA_JOB_MARKET_TOOLS_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-JobMarketTools"
    )
    exit(1)

print("=" * 60)
print("Updating JobMarketAgent to use Lambda")
print("=" * 60)
print(f"Agent ID: {JOB_AGENT_ID}")
print(f"Lambda ARN: {LAMBDA_ARN}")
print()


def delete_existing_action_groups():
    """Delete existing RETURN_CONTROL action groups"""
    print("Checking for existing action groups...")

    try:
        response = control_client.list_agent_action_groups(
            agentId=JOB_AGENT_ID, agentVersion="DRAFT"
        )

        for action_group in response.get("actionGroupSummaries", []):
            group_id = action_group["actionGroupId"]
            group_name = action_group["actionGroupName"]

            if group_name == "job_market_tools":
                print(f"  Deleting existing action group: {group_name}")
                control_client.delete_agent_action_group(
                    agentId=JOB_AGENT_ID,
                    agentVersion="DRAFT",
                    actionGroupId=group_id,
                )
                print(f"  ✓ Deleted {group_name}")
    except Exception as e:
        print(f"  Note: {e}")


def create_lambda_action_group():
    """Create new Lambda-based action group"""
    print("\nCreating Lambda action group...")

    control_client.create_agent_action_group(
        agentId=JOB_AGENT_ID,
        agentVersion="DRAFT",
        actionGroupName="job_market_tools",
        actionGroupExecutor={
            "lambda": LAMBDA_ARN
        },  # ← Lambda instead of RETURN_CONTROL
        functionSchema={
            "functions": [
                {
                    "name": "scrape_hackernews_jobs",
                    "description": "Scrapes current job postings from Hacker News hiring board. Returns list of job titles and companies currently hiring.",
                    "parameters": {},
                },
                {
                    "name": "scrape_itjobswatch_skills",
                    "description": "Fetches trending tech skills with salary data from IT Jobs Watch. Returns top skills with market demand information.",
                    "parameters": {},
                },
            ]
        },
    )
    print("  ✓ Created Lambda action group")


def prepare_agent():
    """Prepare agent to apply changes"""
    print("\nPreparing agent...")
    control_client.prepare_agent(agentId=JOB_AGENT_ID)
    print("  ✓ Agent prepared")

    print("  ⏳ Waiting for preparation to complete...")
    time.sleep(10)


def main():
    # Get existing action group ID
    try:
        response = control_client.list_agent_action_groups(
            agentId=JOB_AGENT_ID, agentVersion="DRAFT"
        )

        action_group_id = None
        for action_group in response.get("actionGroupSummaries", []):
            if action_group["actionGroupName"] == "job_market_tools":
                action_group_id = action_group["actionGroupId"]
                print(f"Found existing action group: {action_group_id}")
                break

        if action_group_id:
            # Update existing action group
            print("\nUpdating action group to use Lambda...")
            control_client.update_agent_action_group(
                agentId=JOB_AGENT_ID,
                agentVersion="DRAFT",
                actionGroupId=action_group_id,
                actionGroupName="job_market_tools",
                actionGroupExecutor={"lambda": LAMBDA_ARN},
                functionSchema={
                    "functions": [
                        {
                            "name": "scrape_hackernews_jobs",
                            "description": "Scrapes current job postings from Hacker News hiring board. Returns list of job titles and companies currently hiring.",
                            "parameters": {},
                        },
                        {
                            "name": "scrape_itjobswatch_skills",
                            "description": "Fetches trending tech skills with salary data from IT Jobs Watch. Returns top skills with market demand information.",
                            "parameters": {},
                        },
                    ]
                },
            )
            print("  ✓ Updated action group to use Lambda")
        else:
            # Create new if doesn't exist
            create_lambda_action_group()

        # Prepare agent
        prepare_agent()

        print("\n" + "=" * 60)
        print("SUCCESS! JobMarketAgent now uses Lambda")
        print("=" * 60)
        print("\nNext step: Test the workflow")
        print("Run: python3 test_agentcore_workflow.py")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise


if __name__ == "__main__":
    main()
