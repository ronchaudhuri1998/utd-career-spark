#!/usr/bin/env python3
"""
Test Nebula API Lambda function locally
"""

import os
import sys
import json
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the lambda function
from lambda_nebula_tools import lambda_handler

load_dotenv()


def test_course_sections_trends():
    """Test course sections trends endpoint"""
    print("Testing get_course_sections_trends...")

    event = {
        "actionGroup": "nebula_tools",
        "function": "get_course_sections_trends",
        "parameters": {"subject_prefix": "CS", "course_number": "1336"},
    }

    result = lambda_handler(event, None)
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def test_professor_sections_trends():
    """Test professor sections trends endpoint"""
    print("\nTesting get_professor_sections_trends...")

    event = {
        "actionGroup": "nebula_tools",
        "function": "get_professor_sections_trends",
        "parameters": {"first_name": "John", "last_name": "Doe"},
    }

    result = lambda_handler(event, None)
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def test_grades_by_semester():
    """Test grades by semester endpoint"""
    print("\nTesting get_grades_by_semester...")

    event = {
        "actionGroup": "nebula_tools",
        "function": "get_grades_by_semester",
        "parameters": {"prefix": "CS", "number": "1336"},
    }

    result = lambda_handler(event, None)
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def test_course_information():
    """Test course information endpoint"""
    print("\nTesting get_course_information...")

    event = {
        "actionGroup": "nebula_tools",
        "function": "get_course_information",
        "parameters": {"subject_prefix": "CS", "course_number": "1336"},
    }

    result = lambda_handler(event, None)
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def test_professor_information():
    """Test professor information endpoint"""
    print("\nTesting get_professor_information...")

    event = {
        "actionGroup": "nebula_tools",
        "function": "get_professor_information",
        "parameters": {"first_name": "John", "last_name": "Doe"},
    }

    result = lambda_handler(event, None)
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def test_course_dashboard_data():
    """Test course dashboard data endpoint"""
    print("\nTesting get_course_dashboard_data...")

    event = {
        "actionGroup": "nebula_tools",
        "function": "get_course_dashboard_data",
        "parameters": {"subject_prefix": "CS", "course_number": "1336"},
    }

    result = lambda_handler(event, None)
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def test_professor_dashboard_data():
    """Test professor dashboard data endpoint"""
    print("\nTesting get_professor_dashboard_data...")

    event = {
        "actionGroup": "nebula_tools",
        "function": "get_professor_dashboard_data",
        "parameters": {"first_name": "John", "last_name": "Doe"},
    }

    result = lambda_handler(event, None)
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def main():
    print("=" * 60)
    print("Testing Nebula API Lambda Function Locally")
    print("=" * 60)

    # Check for API key
    if not os.getenv("NEBULA_API_KEY"):
        print("❌ NEBULA_API_KEY not found in environment variables!")
        print("Please add NEBULA_API_KEY to your .env file")
        return

    print(f"✓ Using API Key: {os.getenv('NEBULA_API_KEY')[:10]}...")

    # Test all endpoints
    try:
        test_course_sections_trends()
        test_professor_sections_trends()
        test_grades_by_semester()
        test_course_information()
        test_professor_information()
        test_course_dashboard_data()
        test_professor_dashboard_data()

        print("\n" + "=" * 60)
        print("All tests completed!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
