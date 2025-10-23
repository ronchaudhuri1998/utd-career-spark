#!/usr/bin/env python3
"""
Local test script for job market validation Lambda
Tests the validation logic with various input scenarios
"""

import json
import sys
import os

# Add the current directory to Python path to import the lambda function
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lambda_validate_job_market import lambda_handler


def test_valid_job_market_format():
    """Test with valid job market format."""
    print("=" * 60)
    print("Testing VALID job market format")
    print("=" * 60)

    valid_text = """=== JOB LISTINGS ===

Job #1:
Title: Software Engineer
Company: Tech Corp
Location: Dallas, TX
Salary: $80k-120k
Type: Full-time
Skills: React, Node.js, TypeScript
Posted: 2 days ago
Description: Looking for a talented engineer...

Job #2:
Title: Data Scientist
Company: AI Labs
Location: Austin, TX
Type: Full-time
Skills: Python, Machine Learning, SQL
Description: Join our AI team...

=== HOT ROLES ===
- Software Engineer (150 openings) [trending up]
- Frontend Developer (85 openings) [stable]
- Data Scientist (120 openings) [trending up]

=== IN-DEMAND SKILLS ===
- React (high demand, 200 listings)
- Python (medium demand, 120 listings)
- JavaScript (high demand, 180 listings)

=== TOP EMPLOYERS ===
- Tech Corp (25 openings, Dallas TX)
- Innovation Labs (18 openings)
- AI Solutions (22 openings, Austin TX)

=== MARKET TRENDS ===
[POSITIVE] AI/ML Integration
Increasing demand for AI and machine learning skills across all industries...

[NEUTRAL] Remote Work Normalization
More companies offering remote options, but hybrid models are becoming standard...

[NEGATIVE] Economic Uncertainty
Some companies reducing hiring, focusing on essential roles only..."""

    event = {
        "actionGroup": "validation_tools",
        "function": "validate_job_market_format",
        "parameters": [
            {"name": "response_text", "type": "string", "value": valid_text}
        ],
    }

    result = lambda_handler(event, {})
    print("Result:", json.dumps(result, indent=2))

    # Parse the response
    response_body = json.loads(
        result["response"]["functionResponse"]["responseBody"]["TEXT"]["body"]
    )
    print(f"\nValidation Result: {response_body['message']}")
    if response_body["errors"]:
        print("Errors:", response_body["errors"])
    if response_body["warnings"]:
        print("Warnings:", response_body["warnings"])


def test_invalid_job_market_format():
    """Test with invalid job market format (missing sections)."""
    print("\n" + "=" * 60)
    print("Testing INVALID job market format (missing sections)")
    print("=" * 60)

    invalid_text = """Here's some job market information:

Software Engineer at Tech Corp
Data Scientist at AI Labs

Some trending skills:
- Python
- React
- JavaScript

That's all the information I have."""

    event = {
        "actionGroup": "validation_tools",
        "function": "validate_job_market_format",
        "parameters": [
            {"name": "response_text", "type": "string", "value": invalid_text}
        ],
    }

    result = lambda_handler(event, {})
    print("Result:", json.dumps(result, indent=2))

    # Parse the response
    response_body = json.loads(
        result["response"]["functionResponse"]["responseBody"]["TEXT"]["body"]
    )
    print(f"\nValidation Result: {response_body['message']}")
    if response_body["errors"]:
        print("Errors:", response_body["errors"])
    if response_body["warnings"]:
        print("Warnings:", response_body["warnings"])


def test_malformed_job_market_format():
    """Test with malformed job market format (wrong structure)."""
    print("\n" + "=" * 60)
    print("Testing MALFORMED job market format (wrong structure)")
    print("=" * 60)

    malformed_text = """=== JOB LISTINGS ===

Job #1:
Title: Software Engineer
Company: Tech Corp
# Missing required fields: Location, Type, Skills

=== HOT ROLES ===
- Software Engineer (150 openings) [invalid trend]
# Wrong trend format

=== IN-DEMAND SKILLS ===
- React (invalid demand level, 200 listings)
# Wrong demand level format

=== TOP EMPLOYERS ===
- Tech Corp (25 openings, Dallas TX)
# This section is OK

=== MARKET TRENDS ===
[INVALID] Some trend
# Wrong trend type"""

    event = {
        "actionGroup": "validation_tools",
        "function": "validate_job_market_format",
        "parameters": [
            {"name": "response_text", "type": "string", "value": malformed_text}
        ],
    }

    result = lambda_handler(event, {})
    print("Result:", json.dumps(result, indent=2))

    # Parse the response
    response_body = json.loads(
        result["response"]["functionResponse"]["responseBody"]["TEXT"]["body"]
    )
    print(f"\nValidation Result: {response_body['message']}")
    if response_body["errors"]:
        print("Errors:", response_body["errors"])
    if response_body["warnings"]:
        print("Warnings:", response_body["warnings"])


def test_no_parameters():
    """Test with no parameters provided."""
    print("\n" + "=" * 60)
    print("Testing NO PARAMETERS provided")
    print("=" * 60)

    event = {
        "actionGroup": "validation_tools",
        "function": "validate_job_market_format",
        "parameters": [],
    }

    result = lambda_handler(event, {})
    print("Result:", json.dumps(result, indent=2))

    # Parse the response
    response_body = json.loads(
        result["response"]["functionResponse"]["responseBody"]["TEXT"]["body"]
    )
    print(f"\nValidation Result: {response_body['message']}")
    if response_body["errors"]:
        print("Errors:", response_body["errors"])
    if response_body["warnings"]:
        print("Warnings:", response_body["warnings"])


def main():
    """Run all tests."""
    print("Job Market Validation Lambda - Local Tests")
    print("=" * 60)

    try:
        test_valid_job_market_format()
        test_invalid_job_market_format()
        test_malformed_job_market_format()
        test_no_parameters()

        print("\n" + "=" * 60)
        print("All tests completed!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
