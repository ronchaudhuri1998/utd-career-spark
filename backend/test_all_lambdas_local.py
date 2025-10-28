#!/usr/bin/env python3
"""
Test all Lambda function code locally to verify they work
"""

import os
import sys
import json
from typing import Dict

# Add Lambda directories to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "agents-aws/job"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "agents-aws/nebula"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "agents-aws/projects"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "agents-aws/validation"))


def test_job_market_lambda():
    """Test Job Market Lambda locally."""
    print("\n" + "=" * 60)
    print("TESTING JOB MARKET TOOLS LAMBDA (LOCAL)")
    print("=" * 60)
    
    try:
        from lambda_job_market_tools import lambda_handler
        
        # Test scrape_hackernews_jobs
        print("\n1. Testing scrape_hackernews_jobs...")
        event = {
            "actionGroup": "job_market_tools",
            "function": "scrape_hackernews_jobs",
            "parameters": [],
        }
        result = lambda_handler(event, None)
        print(f"   Status: {'✓ Success' if result.get('response') else '✗ Failed'}")
        print(f"   Response: {json.dumps(result, indent=2)[:300]}...")
        
        # Test scrape_itjobswatch_skills  
        print("\n2. Testing scrape_itjobswatch_skills...")
        event = {
            "actionGroup": "job_market_tools",
            "function": "scrape_itjobswatch_skills",
            "parameters": [],
        }
        result = lambda_handler(event, None)
        print(f"   Status: {'✓ Success' if result.get('response') else '✗ Failed'}")
        print(f"   Response: {json.dumps(result, indent=2)[:300]}...")
        
        print("\n✅ Job Market Lambda tests completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_nebula_lambda():
    """Test Nebula API Lambda locally."""
    print("\n" + "=" * 60)
    print("TESTING NEBULA API TOOLS LAMBDA (LOCAL)")
    print("=" * 60)
    
    try:
        # Check if API key is set
        if not os.getenv("NEBULA_API_KEY"):
            print("⚠️  NEBULA_API_KEY not set - some tests may fail")
            print("   Set it in .env file to test with real API")
        else:
            print(f"✓ Using API Key: {os.getenv('NEBULA_API_KEY')[:10]}...")
        
        from lambda_nebula_tools import lambda_handler
        
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
        result = lambda_handler(event, None)
        print(f"   Status: {'✓ Success' if result.get('response') else '✗ Failed'}")
        print(f"   Response: {json.dumps(result, indent=2)[:300]}...")
        
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
        result = lambda_handler(event, None)
        print(f"   Status: {'✓ Success' if result.get('response') else '✗ Failed'}")
        print(f"   Response: {json.dumps(result, indent=2)[:300]}...")
        
        print("\n✅ Nebula Lambda tests completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_project_lambda():
    """Test Project Tools Lambda locally."""
    print("\n" + "=" * 60)
    print("TESTING PROJECT TOOLS LAMBDA (LOCAL)")
    print("=" * 60)
    
    try:
        from lambda_project_tools import lambda_handler
        
        # Test search_github_projects
        print("\n1. Testing search_github_projects...")
        event = {
            "actionGroup": "project_tools",
            "function": "search_github_projects",
            "parameters": [
                {"name": "query", "type": "string", "value": "machine learning"},
            ],
        }
        result = lambda_handler(event, None)
        print(f"   Status: {'✓ Success' if result.get('response') else '✗ Failed'}")
        print(f"   Response: {json.dumps(result, indent=2)[:300]}...")
        
        # Test search_arxiv_papers
        print("\n2. Testing search_arxiv_papers...")
        event = {
            "actionGroup": "project_tools",
            "function": "search_arxiv_papers",
            "parameters": [
                {"name": "query", "type": "string", "value": "deep learning"},
            ],
        }
        result = lambda_handler(event, None)
        print(f"   Status: {'✓ Success' if result.get('response') else '✗ Failed'}")
        print(f"   Response: {json.dumps(result, indent=2)[:300]}...")
        
        print("\n✅ Project Tools Lambda tests completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_validation_lambdas():
    """Test Validation Lambdas locally."""
    print("\n" + "=" * 60)
    print("TESTING VALIDATION LAMBDAS (LOCAL)")
    print("=" * 60)
    
    results = []
    
    # Test validate_course
    try:
        print("\n1. Testing validate_course...")
        from lambda_validate_course import lambda_handler
        
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
        result = lambda_handler(event, None)
        is_valid = json.loads(result['response']['functionResponse']['responseBody']['TEXT']['body']).get('is_valid', False)
        print(f"   Status: {'✓ Valid' if is_valid else '✗ Invalid'}")
        print(f"   Response: {json.dumps(result, indent=2)[:300]}...")
        results.append(("validate_course", is_valid))
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        results.append(("validate_course", False))
    
    # Test validate_job_market
    try:
        print("\n2. Testing validate_job_market...")
        from lambda_validate_job_market import lambda_handler
        
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
        result = lambda_handler(event, None)
        is_valid = json.loads(result['response']['functionResponse']['responseBody']['TEXT']['body']).get('is_valid', False)
        print(f"   Status: {'✓ Valid' if is_valid else '✗ Invalid'}")
        print(f"   Response: {json.dumps(result, indent=2)[:300]}...")
        results.append(("validate_job_market", is_valid))
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        results.append(("validate_job_market", False))
    
    # Test validate_project
    try:
        print("\n3. Testing validate_project...")
        from lambda_validate_project import lambda_handler
        
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
        result = lambda_handler(event, None)
        is_valid = json.loads(result['response']['functionResponse']['responseBody']['TEXT']['body']).get('is_valid', False)
        print(f"   Status: {'✓ Valid' if is_valid else '✗ Invalid'}")
        print(f"   Response: {json.dumps(result, indent=2)[:300]}...")
        results.append(("validate_project", is_valid))
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        results.append(("validate_project", False))
    
    print("\n✅ Validation Lambda tests completed!")
    return results


def print_aws_lambda_status():
    """Print status of AWS Lambda functions."""
    print("\n" + "=" * 60)
    print("AWS LAMBDA FUNCTIONS STATUS")
    print("=" * 60)
    
    import subprocess
    
    lambda_names = [
        "UTD-JobMarketTools",
        "UTD-NebulaAPITools",
        "UTD-ProjectTools",
        "UTD-ValidateJobMarket",
        "UTD-ValidateCourse",
        "UTD-ValidateProject",
    ]
    
    for lambda_name in lambda_names:
        try:
            result = subprocess.run(
                [
                    "aws", "lambda", "get-function",
                    "--function-name", lambda_name,
                    "--region", "us-east-1",
                    "--query", "Configuration.{Name:FunctionName, State:State, LastModified:LastModified}",
                    "--output", "json"
                ],
                capture_output=True,
                text=True,
                check=True
            )
            status = json.loads(result.stdout)
            print(f"✓ {status['Name']:30s} State: {status['State']:10s} Modified: {status['LastModified']}")
        except subprocess.CalledProcessError as e:
            print(f"✗ {lambda_name:30s} Failed to get status")
        except json.JSONDecodeError:
            print(f"✗ {lambda_name:30s} Failed to parse status")


def main():
    """Run all tests."""
    print("=" * 60)
    print("TESTING ALL AWS LAMBDA FUNCTIONS (LOCAL TESTING)")
    print("=" * 60)
    
    # First, check AWS Lambda status
    print_aws_lambda_status()
    
    # Test each lambda
    results = []
    results.append(("Job Market Tools", test_job_market_lambda()))
    results.append(("Nebula API Tools", test_nebula_lambda()))
    results.append(("Project Tools", test_project_lambda()))
    
    validation_results = test_validation_lambdas()
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for name, success in results:
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status} - {name}")
    
    for name, success in validation_results:
        status = "✓ VALID" if success else "✗ INVALID"
        print(f"{status} - {name}")
    
    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()

