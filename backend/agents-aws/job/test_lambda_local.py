#!/usr/bin/env python3
"""
Local test script for Job Market Lambda function
"""

import json
import os
import sys

# Add the current directory to path so we can import the lambda function
sys.path.insert(0, ".")


def test_job_lambda_function():
    """Test the Job Market Lambda function locally"""
    print("=" * 60)
    print("TESTING JOB MARKET LAMBDA FUNCTION LOCALLY")
    print("=" * 60)

    try:
        # Import the lambda function
        from lambda_job_market_tools import lambda_handler

        # Test 1: Hacker News jobs
        print("\n1. Testing Hacker News jobs...")
        event = {
            "actionGroup": "job_market_tools",
            "function": "scrape_hackernews_jobs",
            "parameters": {},
        }

        result = lambda_handler(event, None)
        print(f"✓ Hacker News jobs result: {json.dumps(result, indent=2)[:200]}...")

        # Test 2: IT Jobs Watch skills
        print("\n2. Testing IT Jobs Watch skills...")
        event = {
            "actionGroup": "job_market_tools",
            "function": "scrape_it_jobs_watch_skills",
            "parameters": {},
        }

        result = lambda_handler(event, None)
        print(f"✓ IT Jobs Watch skills result: {json.dumps(result, indent=2)[:200]}...")

        print("\n✅ All tests passed!")

    except Exception as e:
        print(f"❌ Error testing Lambda function: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_job_lambda_function()
