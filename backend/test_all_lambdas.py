#!/usr/bin/env python3
"""
Test all AWS Lambda functions by invoking them
"""

import boto3
import json
from botocore.exceptions import ClientError


# Lambda ARNs from environment
LAMBDA_JOB_MARKET_TOOLS_ARN = "arn:aws:lambda:us-east-1:556316456032:function:UTD-JobMarketTools"
LAMBDA_NEBULA_API_TOOLS_ARN = "arn:aws:lambda:us-east-1:556316456032:function:UTD-NebulaAPITools"
LAMBDA_PROJECT_TOOLS_ARN = "arn:aws:lambda:us-east-1:556316456032:function:UTD-ProjectTools"
LAMBDA_VALIDATE_JOBMARKET_ARN = "arn:aws:lambda:us-east-1:556316456032:function:UTD-ValidateJobMarket"
LAMBDA_VALIDATE_COURSE_ARN = "arn:aws:lambda:us-east-1:556316456032:function:UTD-ValidateCourse"
LAMBDA_VALIDATE_PROJECT_ARN = "arn:aws:lambda:us-east-1:556316456032:function:UTD-ValidateProject"


def invoke_lambda(function_arn, payload):
    """Invoke a Lambda function with the given payload."""
    try:
        lambda_client = boto3.client("lambda", region_name="us-east-1")
        response = lambda_client.invoke(
            FunctionName=function_arn,
            InvocationType="RequestResponse",
            Payload=json.dumps(payload),
        )
        
        # Read the response
        response_payload = json.loads(response["Payload"].read())
        return response_payload, None
        
    except ClientError as e:
        return None, str(e)
    except Exception as e:
        return None, str(e)


def test_job_market_tools():
    """Test the Job Market Tools Lambda."""
    print("\n" + "=" * 60)
    print("TESTING JOB MARKET TOOLS LAMBDA")
    print("=" * 60)
    
    # Test scrape_hackernews_jobs
    print("\n1. Testing scrape_hackernews_jobs...")
    event = {
        "actionGroup": "job_market_tools",
        "function": "scrape_hackernews_jobs",
        "parameters": [],
    }
    response, error = invoke_lambda(LAMBDA_JOB_MARKET_TOOLS_ARN, event)
    if error:
        print(f"❌ Error: {error}")
    else:
        print(f"✓ Response: {json.dumps(response, indent=2)[:500]}...")
    
    # Test scrape_itjobswatch_skills
    print("\n2. Testing scrape_itjobswatch_skills...")
    event = {
        "actionGroup": "job_market_tools",
        "function": "scrape_itjobswatch_skills",
        "parameters": [],
    }
    response, error = invoke_lambda(LAMBDA_JOB_MARKET_TOOLS_ARN, event)
    if error:
        print(f"❌ Error: {error}")
    else:
        print(f"✓ Response: {json.dumps(response, indent=2)[:500]}...")
    
    print("\n✅ Job Market Tools Lambda test completed!")


def test_nebula_api_tools():
    """Test the Nebula API Tools Lambda."""
    print("\n" + "=" * 60)
    print("TESTING NEBULA API TOOLS LAMBDA")
    print("=" * 60)
    
    # Test get_course_information
    print("\n1. Testing get_course_information...")
    event = {
        "actionGroup": "nebula_tools",
        "function": "get_course_information",
        "parameters": [
            {"name": "subject_prefix", "type": "string", "value": "CS"},
            {"name": "course_number", "type": "string", "value": "1336"},
        ],
    }
    response, error = invoke_lambda(LAMBDA_NEBULA_API_TOOLS_ARN, event)
    if error:
        print(f"❌ Error: {error}")
    else:
        print(f"✓ Response: {json.dumps(response, indent=2)[:500]}...")
    
    # Test get_course_sections_trends
    print("\n2. Testing get_course_sections_trends...")
    event = {
        "actionGroup": "nebula_tools",
        "function": "get_course_sections_trends",
        "parameters": [
            {"name": "subject_prefix", "type": "string", "value": "CS"},
            {"name": "course_number", "type": "string", "value": "1336"},
        ],
    }
    response, error = invoke_lambda(LAMBDA_NEBULA_API_TOOLS_ARN, event)
    if error:
        print(f"❌ Error: {error}")
    else:
        print(f"✓ Response: {json.dumps(response, indent=2)[:500]}...")
    
    print("\n✅ Nebula API Tools Lambda test completed!")


def test_project_tools():
    """Test the Project Tools Lambda."""
    print("\n" + "=" * 60)
    print("TESTING PROJECT TOOLS LAMBDA")
    print("=" * 60)
    
    # Test search_github_projects
    print("\n1. Testing search_github_projects...")
    event = {
        "actionGroup": "project_tools",
        "function": "search_github_projects",
        "parameters": [
            {"name": "query", "type": "string", "value": "machine learning"},
        ],
    }
    response, error = invoke_lambda(LAMBDA_PROJECT_TOOLS_ARN, event)
    if error:
        print(f"❌ Error: {error}")
    else:
        print(f"✓ Response: {json.dumps(response, indent=2)[:500]}...")
    
    # Test search_arxiv_papers
    print("\n2. Testing search_arxiv_papers...")
    event = {
        "actionGroup": "project_tools",
        "function": "search_arxiv_papers",
        "parameters": [
            {"name": "query", "type": "string", "value": "deep learning"},
        ],
    }
    response, error = invoke_lambda(LAMBDA_PROJECT_TOOLS_ARN, event)
    if error:
        print(f"❌ Error: {error}")
    else:
        print(f"✓ Response: {json.dumps(response, indent=2)[:500]}...")
    
    print("\n✅ Project Tools Lambda test completed!")


def test_validate_lambdas():
    """Test the validation Lambda functions."""
    print("\n" + "=" * 60)
    print("TESTING VALIDATION LAMBDAS")
    print("=" * 60)
    
    # Test validate_course
    print("\n1. Testing validate_course...")
    test_course_response = """
=== COURSE CATALOG ===
Course #1:
Code: CS1336
Name: Programming Fundamentals
Credits: 3
Difficulty: beginner
Prerequisites: None
Description: Introduction to programming

=== SEMESTER PLAN ===
- Fall 2024 (3 credits): CS1336

=== PREREQUISITES ===
- None

=== SKILL AREAS ===
- Programming (high importance): CS1336

=== ACADEMIC RESOURCES ===
[tutoring] CS Learning Center
Drop-in tutoring for programming
"""
    
    event = {
        "actionGroup": "validation_tools",
        "function": "validate_course_format",
        "parameters": [
            {"name": "response_text", "type": "string", "value": test_course_response},
        ],
    }
    response, error = invoke_lambda(LAMBDA_VALIDATE_COURSE_ARN, event)
    if error:
        print(f"❌ Error: {error}")
    else:
        print(f"✓ Response: {json.dumps(response, indent=2)}")
    
    # Test validate_job_market
    print("\n2. Testing validate_job_market...")
    test_job_response = """
=== JOB LISTINGS ===
Job #1:
Title: Software Engineer
Company: Tech Corp
Location: Remote
Type: Full-time
Skills: Python, JavaScript

=== HOT ROLES ===
- Software Engineer (50 openings) [trending up]

=== IN-DEMAND SKILLS ===
- Python (high demand, 120 listings)

=== TOP EMPLOYERS ===
- Tech Corp (15 openings)

=== MARKET TRENDS ===
[POSITIVE] Remote Work
Remote work is becoming increasingly common
"""
    
    event = {
        "actionGroup": "validation_tools",
        "function": "validate_job_market_format",
        "parameters": [
            {"name": "response_text", "type": "string", "value": test_job_response},
        ],
    }
    response, error = invoke_lambda(LAMBDA_VALIDATE_JOBMARKET_ARN, event)
    if error:
        print(f"❌ Error: {error}")
    else:
        print(f"✓ Response: {json.dumps(response, indent=2)}")
    
    # Test validate_project
    print("\n3. Testing validate_project...")
    test_project_response = """
=== PROJECT RECOMMENDATIONS ===
Project #1:
Title: Build a Weather App
Description: Create a weather app using API integration
Skills: JavaScript, API integration
Difficulty: beginner
"""
    
    event = {
        "actionGroup": "validation_tools",
        "function": "validate_project_format",
        "parameters": [
            {
                "name": "response_text",
                "type": "string",
                "value": test_project_response,
            },
        ],
    }
    response, error = invoke_lambda(LAMBDA_VALIDATE_PROJECT_ARN, event)
    if error:
        print(f"❌ Error: {error}")
    else:
        print(f"✓ Response: {json.dumps(response, indent=2)}")
    
    print("\n✅ Validation Lambdas test completed!")


def main():
    """Run all lambda tests."""
    print("=" * 60)
    print("TESTING ALL AWS LAMBDA FUNCTIONS")
    print("=" * 60)
    
    # Run all tests
    test_job_market_tools()
    test_nebula_api_tools()
    test_project_tools()
    test_validate_lambdas()
    
    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()

