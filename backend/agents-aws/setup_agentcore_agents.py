#!/usr/bin/env python3
"""
setup_agentcore_agents.py
Creates 4 agents with collaboration, tools, and memory in AWS Bedrock AgentCore
"""

import boto3
import os
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Generate unique suffix for agent names to avoid conflicts
TIMESTAMP = datetime.now().strftime("%Y%m%d-%H%M")
print(f"Using timestamp suffix: {TIMESTAMP}")

control_client = boto3.client(
    "bedrock-agent", region_name=os.getenv("AWS_REGION", "us-east-1")
)


def delete_all_existing_agents():
    """Delete all UTD-* agents to start fresh"""
    print("\n" + "=" * 60)
    print("Checking for existing agents to delete...")
    print("=" * 60)

    try:
        response = control_client.list_agents(maxResults=50)

        for agent_summary in response.get("agentSummaries", []):
            agent_name = agent_summary["agentName"]
            agent_id = agent_summary["agentId"]

            # Delete only our UTD agents
            if agent_name.startswith("UTD-"):
                print(f"\n  Deleting {agent_name} ({agent_id})...")

                try:
                    # Delete agent (this also deletes associated resources)
                    control_client.delete_agent(
                        agentId=agent_id, skipResourceInUseCheck=True
                    )
                    print(f"    ✓ Deleted {agent_name}")
                    time.sleep(2)  # Wait between deletions
                except Exception as e:
                    print(f"    ⚠️  Error deleting {agent_name}: {e}")

        print("\n  ✓ Cleanup complete")
        print("  ⏳ Waiting for deletion to propagate...")
        time.sleep(10)

    except Exception as e:
        print(f"  ⚠️  Error during cleanup: {e}")


def create_and_prepare_agent(
    name, instruction, is_supervisor=False, with_tools=False, skip_prepare=False
):
    """Create agent, optionally prepare it, and create alias"""

    print(f"\n{'='*60}")
    print(f"Creating {name}...")
    print("=" * 60)

    # 1. Create agent
    create_params = {
        "agentName": name,
        "foundationModel": "anthropic.claude-3-haiku-20240307-v1:0",
        "instruction": instruction,
        "memoryConfiguration": {
            "enabledMemoryTypes": ["SESSION_SUMMARY"],
            "storageDays": 90,
        },
    }

    # Add role ARN if provided in environment
    role_arn = os.getenv("AGENTCORE_EXECUTION_ROLE_ARN")
    if role_arn:
        create_params["agentResourceRoleArn"] = role_arn

    if is_supervisor:
        create_params["agentCollaboration"] = "SUPERVISOR"

    agent_response = control_client.create_agent(**create_params)
    agent_id = agent_response["agent"]["agentId"]
    print(f"✓ Created {name}: {agent_id}")

    # Wait for agent to finish creating
    print(f"  ⏳ Waiting for agent to be ready...")
    time.sleep(15)

    # 2. Add action groups if needed
    if with_tools:
        lambda_arn = os.getenv("LAMBDA_JOB_MARKET_TOOLS_ARN")
        if not lambda_arn:
            print(
                f"  ⚠️  Warning: LAMBDA_JOB_MARKET_TOOLS_ARN not found, skipping tools"
            )
        else:
            control_client.create_agent_action_group(
                agentId=agent_id,
                agentVersion="DRAFT",
                actionGroupName="job_market_tools",
                actionGroupExecutor={
                    "lambda": lambda_arn
                },  # Use Lambda instead of RETURN_CONTROL
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
            print(f"  ✓ Added Lambda action groups to {name}")

    # 3. Prepare agent (skip for supervisor until collaborators are added)
    if not skip_prepare:
        control_client.prepare_agent(agentId=agent_id)
        print(f"  ✓ Prepared {name}")

        # Wait for preparation to complete
        print(f"  ⏳ Waiting for preparation to complete...")
        time.sleep(10)

        # 4. Create alias
        alias_response = control_client.create_agent_alias(
            agentId=agent_id, agentAliasName="prod"
        )
        alias_id = alias_response["agentAlias"]["agentAliasId"]
        alias_arn = alias_response["agentAlias"]["agentAliasArn"]
        print(f"  ✓ Created alias for {name}: {alias_id}")
        print(f"  ✓ Alias ARN: {alias_arn}")

        return agent_id, alias_id, alias_arn
    else:
        print(f"  ⚠️  Skipping prepare/alias (will do after adding collaborators)")
        return agent_id, None, None


def main():
    print("=" * 60)
    print("AWS Bedrock AgentCore Setup")
    print("Creating Multi-Agent Career Guidance System")
    print("=" * 60)

    # Delete existing agents first
    delete_all_existing_agents()

    # Create sub-agents first
    job_id, job_alias_id, job_alias_arn = create_and_prepare_agent(
        f"UTD-JobMarket-{TIMESTAMP}",
        """You are the Job Market Analyst within the UTD Career Guidance AI System.
Analyze current hiring needs, emerging roles, salary outlook, and core skills for technology careers relevant to UTD students.
Be precise, cite trends or assumptions, and flag any missing data.
Use short headings and bullet points so students can act immediately.

When you need current job market data, use your tools:
- scrape_hackernews_jobs: to get recent job postings
- scrape_itjobswatch_skills: to get trending skills and salary data""",
        with_tools=True,
    )

    course_id, course_alias_id, course_alias_arn = create_and_prepare_agent(
        f"UTD-CourseCatalog-{TIMESTAMP}",
        """You are the Course Catalog Specialist within the UTD Career Guidance AI System.
Align employer-demanded skills with UT Dallas courses, certificates, and campus resources.
Be precise, cite trends or assumptions, and flag any missing data.
Use short headings and bullet points so students can act immediately.

Recommend UT Dallas courses that align with job market needs and career goals.
Consider the student's background, current knowledge, and time constraints.""",
    )

    project_id, project_alias_id, project_alias_arn = create_and_prepare_agent(
        f"UTD-ProjectAdvisor-{TIMESTAMP}",
        """You are the Project Advisor within the UTD Career Guidance AI System.
Design practical, scoped project ideas and technology stacks that align with the student's target roles.
Be precise, cite trends or assumptions, and flag any missing data.
Use short headings and bullet points so students can act immediately.

Suggest hands-on projects and technologies to build a standout portfolio.
Make recommendations based on job market demand and the student's skill level.""",
    )

    # Create supervisor agent (skip prepare until collaborators are added)
    planner_id, _, _ = create_and_prepare_agent(
        f"UTD-CareerPlanner-{TIMESTAMP}",
        """You are the Career Planner Orchestrator - the supervisor agent coordinating specialist agents.
Synthesize job market research, academic guidance, and project advice into a cohesive, staged career plan.
Be precise, cite trends or assumptions, and flag any missing data.
Use short headings and bullet points so students can act immediately.

You coordinate with three specialist agents:
1. JobMarketAgent - analyzes hiring trends and skill demands
2. CourseCatalogAgent - recommends UT Dallas courses
3. ProjectAdvisorAgent - suggests portfolio projects

When a student asks for career guidance, delegate to the appropriate specialist agents to gather information,
then synthesize their insights into a comprehensive, actionable career plan.""",
        is_supervisor=True,
        skip_prepare=True,  # Can't prepare until collaborators are added
    )

    # Associate collaborators with supervisor
    print(f"\n{'='*60}")
    print("Associating Collaborator Agents...")
    print("=" * 60)

    control_client.associate_agent_collaborator(
        agentId=planner_id,
        agentVersion="DRAFT",
        agentDescriptor={"aliasArn": job_alias_arn},
        collaboratorName="JobMarketAgent",
        collaborationInstruction="This agent analyzes job markets, hiring trends, and skill demands. Use it when you need employment data, salary information, or insights about which skills are in demand. It has access to live job market data.",
        relayConversationHistory="TO_COLLABORATOR",
    )
    print("  ✓ Associated JobMarketAgent as collaborator")

    control_client.associate_agent_collaborator(
        agentId=planner_id,
        agentVersion="DRAFT",
        agentDescriptor={"aliasArn": course_alias_arn},
        collaboratorName="CourseCatalogAgent",
        collaborationInstruction="This agent recommends UT Dallas courses aligned with career goals. Use it when you need academic planning, course recommendations, or campus resource suggestions.",
        relayConversationHistory="TO_COLLABORATOR",
    )
    print("  ✓ Associated CourseCatalogAgent as collaborator")

    control_client.associate_agent_collaborator(
        agentId=planner_id,
        agentVersion="DRAFT",
        agentDescriptor={"aliasArn": project_alias_arn},
        collaboratorName="ProjectAdvisorAgent",
        collaborationInstruction="This agent suggests portfolio projects and technologies. Use it when you need project ideas, technology stack recommendations, or advice on building hands-on skills.",
        relayConversationHistory="TO_COLLABORATOR",
    )
    print("  ✓ Associated ProjectAdvisorAgent as collaborator")

    # Now prepare and create alias for supervisor
    print(f"\n{'='*60}")
    print("Preparing Supervisor Agent...")
    print("=" * 60)

    control_client.prepare_agent(agentId=planner_id)
    print(f"  ✓ Prepared supervisor agent")

    print(f"  ⏳ Waiting for preparation to complete...")
    time.sleep(10)

    planner_alias_response = control_client.create_agent_alias(
        agentId=planner_id, agentAliasName="prod"
    )
    planner_alias_id = planner_alias_response["agentAlias"]["agentAliasId"]
    planner_alias_arn = planner_alias_response["agentAlias"]["agentAliasArn"]
    print(f"  ✓ Created alias for supervisor: {planner_alias_id}")
    print(f"  ✓ Alias ARN: {planner_alias_arn}")

    print("\n" + "=" * 60)
    print("SUCCESS! AgentCore Setup Complete")
    print("=" * 60)
    print("\nAdd these to your .env file:\n")
    print(f"AGENTCORE_JOB_AGENT_ID={job_id}")
    print(f"AGENTCORE_JOB_ALIAS_ID={job_alias_id}")
    print(f"AGENTCORE_COURSE_AGENT_ID={course_id}")
    print(f"AGENTCORE_COURSE_ALIAS_ID={course_alias_id}")
    print(f"AGENTCORE_PROJECT_AGENT_ID={project_id}")
    print(f"AGENTCORE_PROJECT_ALIAS_ID={project_alias_id}")
    print(f"AGENTCORE_PLANNER_AGENT_ID={planner_id}")
    print(f"AGENTCORE_PLANNER_ALIAS_ID={planner_alias_id}")
    print("\n" + "=" * 60)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback

        traceback.print_exc()
        exit(1)
