#!/usr/bin/env python3
"""
setup_agentcore_agents.py
Creates 4 agents with collaboration, tools, and memory in AWS Bedrock AgentCore
"""

import boto3
import os
import time
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Generate unique suffix for agent names to avoid conflicts
TIMESTAMP = datetime.now().strftime("%Y%m%d-%H%M")
print(f"Using timestamp suffix: {TIMESTAMP}")

control_client = boto3.client(
    "bedrock-agent", region_name=os.getenv("AWS_REGION", "us-east-1")
)

# Path to prompts directory
PROMPTS_DIR = Path(__file__).parent / "prompts"


def load_prompt(filename: str) -> str:
    """Load agent prompt from external file."""
    prompt_path = PROMPTS_DIR / filename
    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt file not found: {prompt_path}")

    with open(prompt_path, "r") as f:
        return f.read().strip()


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
    name,
    instruction,
    is_supervisor=False,
    with_tools=False,
    tool_type="job",
    skip_prepare=False,
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
        if tool_type == "job":
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
                print(f"  ✓ Added job market tools to {name}")

        elif tool_type == "project":
            lambda_arn = os.getenv("LAMBDA_PROJECT_TOOLS_ARN")
            if not lambda_arn:
                print(
                    f"  ⚠️  Warning: LAMBDA_PROJECT_TOOLS_ARN not found, skipping tools"
                )
            else:
                control_client.create_agent_action_group(
                    agentId=agent_id,
                    agentVersion="DRAFT",
                    actionGroupName="project_tools",
                    actionGroupExecutor={"lambda": lambda_arn},
                    functionSchema={
                        "functions": [
                            {
                                "name": "search_github_projects",
                                "description": "Search GitHub repositories for project inspiration. Returns trending repos with stars, language, and topics.",
                                "parameters": {
                                    "query": {
                                        "type": "string",
                                        "description": "Search query for repositories",
                                        "required": True,
                                    },
                                    "language": {
                                        "type": "string",
                                        "description": "Programming language filter (optional)",
                                        "required": False,
                                    },
                                },
                            },
                            {
                                "name": "search_arxiv_papers",
                                "description": "Search ArXiv for research papers that could inspire academic projects. Returns paper titles, abstracts, and authors.",
                                "parameters": {
                                    "query": {
                                        "type": "string",
                                        "description": "Search query for papers",
                                        "required": True,
                                    },
                                    "category": {
                                        "type": "string",
                                        "description": "ArXiv category filter (optional)",
                                        "required": False,
                                    },
                                },
                            },
                            {
                                "name": "search_huggingface_models",
                                "description": "Search Hugging Face for ML models and datasets. Returns model names, tasks, and download counts.",
                                "parameters": {
                                    "task": {
                                        "type": "string",
                                        "description": "ML task filter (optional)",
                                        "required": False,
                                    },
                                    "query": {
                                        "type": "string",
                                        "description": "Search query for models/datasets",
                                        "required": False,
                                    },
                                },
                            },
                            {
                                "name": "search_kaggle_datasets",
                                "description": "Search Kaggle for datasets and competitions. Returns dataset names, sizes, and download counts.",
                                "parameters": {
                                    "query": {
                                        "type": "string",
                                        "description": "Search query for datasets/competitions",
                                        "required": True,
                                    }
                                },
                            },
                            {
                                "name": "search_project_inspiration",
                                "description": "Multi-source search across GitHub, ArXiv, Hugging Face, and Kaggle for comprehensive project inspiration.",
                                "parameters": {
                                    "query": {
                                        "type": "string",
                                        "description": "Search query for project inspiration",
                                        "required": True,
                                    },
                                    "sources": {
                                        "type": "string",
                                        "description": "Comma-separated list of sources to search (github, arxiv, huggingface, kaggle)",
                                        "required": False,
                                    },
                                },
                            },
                        ]
                    },
                )
                print(f"  ✓ Added project tools to {name}")

        elif tool_type == "course":
            lambda_arn = os.getenv("LAMBDA_NEBULA_API_TOOLS_ARN")
            if not lambda_arn:
                print(
                    f"  ⚠️  Warning: LAMBDA_NEBULA_API_TOOLS_ARN not found, skipping tools"
                )
            else:
                control_client.create_agent_action_group(
                    agentId=agent_id,
                    agentVersion="DRAFT",
                    actionGroupName="nebula_tools",
                    actionGroupExecutor={"lambda": lambda_arn},
                    functionSchema={
                        "functions": [
                            {
                                "name": "get_course_sections_trends",
                                "description": "Get historical section data with grade distributions and professor information for a specific course.",
                                "parameters": {
                                    "subject_prefix": {
                                        "type": "string",
                                        "description": "Course prefix (e.g., CS, MATH)",
                                        "required": True,
                                    },
                                    "course_number": {
                                        "type": "string",
                                        "description": "Course number (e.g., 1336, 2413)",
                                        "required": True,
                                    },
                                },
                            },
                            {
                                "name": "get_professor_sections_trends",
                                "description": "Get all sections a specific professor has taught with grade distributions and course details.",
                                "parameters": {
                                    "first_name": {
                                        "type": "string",
                                        "description": "Professor's first name",
                                        "required": True,
                                    },
                                    "last_name": {
                                        "type": "string",
                                        "description": "Professor's last name",
                                        "required": True,
                                    },
                                },
                            },
                            {
                                "name": "get_grades_by_semester",
                                "description": "Get grade distribution data for specific courses or professors in particular semesters.",
                                "parameters": {
                                    "prefix": {
                                        "type": "string",
                                        "description": "Course prefix",
                                        "required": False,
                                    },
                                    "number": {
                                        "type": "string",
                                        "description": "Course number",
                                        "required": False,
                                    },
                                    "first_name": {
                                        "type": "string",
                                        "description": "Professor's first name",
                                        "required": False,
                                    },
                                    "last_name": {
                                        "type": "string",
                                        "description": "Professor's last name",
                                        "required": False,
                                    },
                                },
                            },
                            {
                                "name": "get_course_information",
                                "description": "Get basic course metadata like title, description, prerequisites, and core flags.",
                                "parameters": {
                                    "subject_prefix": {
                                        "type": "string",
                                        "description": "Course prefix",
                                        "required": True,
                                    },
                                    "course_number": {
                                        "type": "string",
                                        "description": "Course number",
                                        "required": True,
                                    },
                                },
                            },
                            {
                                "name": "get_professor_information",
                                "description": "Get professor details, titles, and basic information.",
                                "parameters": {
                                    "first_name": {
                                        "type": "string",
                                        "description": "Professor's first name",
                                        "required": True,
                                    },
                                    "last_name": {
                                        "type": "string",
                                        "description": "Professor's last name",
                                        "required": True,
                                    },
                                },
                            },
                            {
                                "name": "get_course_dashboard_data",
                                "description": "Get comprehensive course dashboard data combining course info and trends.",
                                "parameters": {
                                    "subject_prefix": {
                                        "type": "string",
                                        "description": "Course prefix",
                                        "required": True,
                                    },
                                    "course_number": {
                                        "type": "string",
                                        "description": "Course number",
                                        "required": True,
                                    },
                                },
                            },
                            {
                                "name": "get_professor_dashboard_data",
                                "description": "Get comprehensive professor dashboard data combining professor info and teaching history.",
                                "parameters": {
                                    "first_name": {
                                        "type": "string",
                                        "description": "Professor's first name",
                                        "required": True,
                                    },
                                    "last_name": {
                                        "type": "string",
                                        "description": "Professor's last name",
                                        "required": True,
                                    },
                                },
                            },
                        ]
                    },
                )
                print(f"  ✓ Added Nebula API tools to {name}")

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
    print("\nLoading agent prompts from external files...")
    job_prompt = load_prompt("job_market_agent.txt")
    course_prompt = load_prompt("course_catalog_agent.txt")
    project_prompt = load_prompt("project_advisor_agent.txt")
    planner_prompt = load_prompt("career_planner_supervisor.txt")

    job_id, job_alias_id, job_alias_arn = create_and_prepare_agent(
        f"UTD-JobMarket-{TIMESTAMP}",
        job_prompt,
        with_tools=True,
        tool_type="job",
    )

    course_id, course_alias_id, course_alias_arn = create_and_prepare_agent(
        f"UTD-CourseCatalog-{TIMESTAMP}",
        course_prompt,
        with_tools=True,
        tool_type="course",
    )

    project_id, project_alias_id, project_alias_arn = create_and_prepare_agent(
        f"UTD-ProjectAdvisor-{TIMESTAMP}",
        project_prompt,
        with_tools=True,
        tool_type="project",
    )

    # Create supervisor agent (skip prepare until collaborators are added)
    planner_id, _, _ = create_and_prepare_agent(
        f"UTD-CareerPlanner-{TIMESTAMP}",
        planner_prompt,
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
