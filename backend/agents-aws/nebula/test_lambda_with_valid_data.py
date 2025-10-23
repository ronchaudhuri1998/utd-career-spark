#!/usr/bin/env python3
"""
Test Nebula API Lambda function with valid UTD course data
Based on https://api.utdnebula.com/swagger/index.html#/Grades
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


def test_course_sections_trends_valid():
    """Test course sections trends with valid CS course"""
    print("Testing get_course_sections_trends with CS 1336...")

    event = {
        "actionGroup": "nebula_tools",
        "function": "get_course_sections_trends",
        "parameters": [
            {"name": "subject_prefix", "type": "string", "value": "CS"},
            {"name": "course_number", "type": "string", "value": "1336"},
        ],
    }

    result = lambda_handler(event, None)
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def test_course_information_valid():
    """Test course information with valid CS course"""
    print("\nTesting get_course_information with CS 1336...")

    event = {
        "actionGroup": "nebula_tools",
        "function": "get_course_information",
        "parameters": [
            {"name": "subject_prefix", "type": "string", "value": "CS"},
            {"name": "course_number", "type": "string", "value": "1336"},
        ],
    }

    result = lambda_handler(event, None)
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def test_grades_by_semester_valid():
    """Test grades by semester with valid parameters"""
    print("\nTesting get_grades_by_semester with CS 1336...")

    event = {
        "actionGroup": "nebula_tools",
        "function": "get_grades_by_semester",
        "parameters": [
            {"name": "prefix", "type": "string", "value": "CS"},
            {"name": "number", "type": "string", "value": "1336"},
        ],
    }

    result = lambda_handler(event, None)
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def test_course_dashboard_data_valid():
    """Test course dashboard data with valid CS course"""
    print("\nTesting get_course_dashboard_data with CS 1336...")

    event = {
        "actionGroup": "nebula_tools",
        "function": "get_course_dashboard_data",
        "parameters": [
            {"name": "subject_prefix", "type": "string", "value": "CS"},
            {"name": "course_number", "type": "string", "value": "1336"},
        ],
    }

    result = lambda_handler(event, None)
    print(f"Result: {json.dumps(result, indent=2)}")
    return result


def test_different_courses():
    """Test with different popular UTD courses"""
    courses = [
        ("CS", "1336"),  # Programming Fundamentals
        ("CS", "1337"),  # Computer Science I
        ("CS", "2336"),  # Computer Science II
        ("CS", "2413"),  # Data Structures
        ("MATH", "2414"),  # Calculus II
        ("PHYS", "2325"),  # Mechanics
    ]

    print("\n" + "=" * 60)
    print("Testing with different UTD courses...")
    print("=" * 60)

    for subject, number in courses:
        print(f"\nTesting {subject} {number}...")

        event = {
            "actionGroup": "nebula_tools",
            "function": "get_course_information",
            "parameters": [
                {"name": "subject_prefix", "type": "string", "value": subject},
                {"name": "course_number", "type": "string", "value": number},
            ],
        }

        result = lambda_handler(event, None)
        response_body = (
            result.get("response", {})
            .get("functionResponse", {})
            .get("responseBody", {})
        )
        text_body = response_body.get("TEXT", {}).get("body", "{}")

        try:
            data = json.loads(text_body)
            course_info = data.get("course_info", {})
            summary = data.get("summary", "")

            if course_info and course_info != {}:
                if isinstance(course_info, dict):
                    print(f"  ✓ Found course: {course_info.get('title', 'Unknown')}")
                else:
                    print(f"  ✓ Found course data: {type(course_info)}")
                print(f"  ✓ Summary: {summary}")
            else:
                print(f"  ⚠️  No course data found")
                print(f"  ✓ Summary: {summary}")

        except json.JSONDecodeError:
            print(f"  ❌ Error parsing response: {text_body}")


def test_professor_data():
    """Test professor information with common UTD names"""
    print("\n" + "=" * 60)
    print("Testing professor information...")
    print("=" * 60)

    # Common UTD professor names (these might not exist, but we'll test)
    professors = [
        ("John", "Smith"),
        ("Jane", "Doe"),
        ("Michael", "Johnson"),
        ("Sarah", "Williams"),
    ]

    for first_name, last_name in professors:
        print(f"\nTesting Professor {first_name} {last_name}...")

        event = {
            "actionGroup": "nebula_tools",
            "function": "get_professor_information",
            "parameters": [
                {"name": "first_name", "type": "string", "value": first_name},
                {"name": "last_name", "type": "string", "value": last_name},
            ],
        }

        result = lambda_handler(event, None)
        response_body = (
            result.get("response", {})
            .get("functionResponse", {})
            .get("responseBody", {})
        )
        text_body = response_body.get("TEXT", {}).get("body", "{}")

        try:
            data = json.loads(text_body)
            professor_info = data.get("professor_info", {})
            summary = data.get("summary", "")

            if professor_info and professor_info != {}:
                print(f"  ✓ Found professor: {professor_info}")
                print(f"  ✓ Summary: {summary}")
            else:
                print(f"  ⚠️  No professor data found")
                print(f"  ✓ Summary: {summary}")

        except json.JSONDecodeError:
            print(f"  ❌ Error parsing response: {text_body}")


def main():
    print("=" * 60)
    print("Testing Nebula API Lambda Function with Valid Data")
    print("=" * 60)

    # Check for API key
    if not os.getenv("NEBULA_API_KEY"):
        print("❌ NEBULA_API_KEY not found in environment variables!")
        print("Please add NEBULA_API_KEY to your .env file")
        return

    print(f"✓ Using API Key: {os.getenv('NEBULA_API_KEY')[:10]}...")

    # Test with valid CS 1336 data
    try:
        test_course_sections_trends_valid()
        test_course_information_valid()
        test_grades_by_semester_valid()
        test_course_dashboard_data_valid()

        # Test with different courses
        test_different_courses()

        # Test professor data
        test_professor_data()

        print("\n" + "=" * 60)
        print("All tests completed!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
