#!/usr/bin/env python3
"""
Local test script for project validation Lambda
Tests the validation logic with various input scenarios
"""

import json
import sys
import os

# Add the current directory to Python path to import the lambda function
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lambda_validate_project import lambda_handler


def test_valid_project_format():
    """Test with valid project format."""
    print("=" * 60)
    print("Testing VALID project format")
    print("=" * 60)

    valid_text = """=== PROJECT RECOMMENDATIONS ===

Project #1:
Title: Personal Portfolio Website
Description: Build a responsive portfolio website showcasing your projects and skills. Include sections for about, projects, skills, and contact information.
Skills: HTML, CSS, JavaScript, React, Git
Difficulty: beginner
Estimated Time: 2-3 weeks
Category: Web Development
Career Relevance: Essential for any developer role, demonstrates frontend skills

Project #2:
Title: Machine Learning Model for Stock Prediction
Description: Develop a machine learning model to predict stock prices using historical data. Use Python libraries like pandas, scikit-learn, and implement various algorithms.
Skills: Python, Machine Learning, Pandas, Scikit-learn, Data Analysis
Difficulty: intermediate
Estimated Time: 4-6 weeks
Category: Data Science
Career Relevance: High demand for ML skills in finance and tech industries

Project #3:
Title: RESTful API with Authentication
Description: Create a RESTful API with user authentication, CRUD operations, and database integration. Include proper error handling and API documentation.
Skills: Node.js, Express, MongoDB, JWT, API Design
Difficulty: intermediate
Estimated Time: 3-4 weeks
Category: Backend Development
Career Relevance: Critical for backend developer positions

Project #4:
Title: Real-time Chat Application
Description: Build a real-time chat application using WebSockets. Include features like private messaging, group chats, and message history.
Skills: WebSockets, Socket.io, React, Node.js, Real-time Programming
Difficulty: advanced
Estimated Time: 5-6 weeks
Category: Full-stack Development
Career Relevance: Demonstrates full-stack capabilities and real-time programming skills"""

    event = {
        "actionGroup": "validation_tools",
        "function": "validate_project_format",
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


def test_invalid_project_format():
    """Test with invalid project format (missing section)."""
    print("\n" + "=" * 60)
    print("Testing INVALID project format (missing section)")
    print("=" * 60)

    invalid_text = """Here are some project recommendations:

Personal Portfolio Website - Build a responsive portfolio website
Machine Learning Model - Develop a ML model for stock prediction
RESTful API - Create an API with authentication

These projects will help you build relevant skills."""

    event = {
        "actionGroup": "validation_tools",
        "function": "validate_project_format",
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


def test_malformed_project_format():
    """Test with malformed project format (wrong structure)."""
    print("\n" + "=" * 60)
    print("Testing MALFORMED project format (wrong structure)")
    print("=" * 60)

    malformed_text = """=== PROJECT RECOMMENDATIONS ===

Project #1:
Title: Personal Portfolio Website
Description: Build a responsive portfolio website
# Missing required fields: Skills, Difficulty

Project #2:
Title: Machine Learning Model
Description: Develop a ML model
Skills: Python, Machine Learning
Difficulty: invalid_level
# Wrong difficulty level

Project #3:
Title: RESTful API
Description: Create an API
Skills: Node.js, Express
Difficulty: intermediate
# This project is OK"""

    event = {
        "actionGroup": "validation_tools",
        "function": "validate_project_format",
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
        "function": "validate_project_format",
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
    print("Project Validation Lambda - Local Tests")
    print("=" * 60)

    try:
        test_valid_project_format()
        test_invalid_project_format()
        test_malformed_project_format()
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
