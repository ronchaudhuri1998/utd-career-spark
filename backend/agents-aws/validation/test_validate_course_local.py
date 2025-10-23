#!/usr/bin/env python3
"""
Local test script for course validation Lambda
Tests the validation logic with various input scenarios
"""

import json
import sys
import os

# Add the current directory to Python path to import the lambda function
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lambda_validate_course import lambda_handler


def test_valid_course_format():
    """Test with valid course format."""
    print("=" * 60)
    print("Testing VALID course format")
    print("=" * 60)

    valid_text = """=== COURSE CATALOG ===

Course #1:
Code: CS 4375
Name: Introduction to Machine Learning
Credits: 3
Difficulty: intermediate
Prerequisites: CS 3341, MATH 2418
Semester: Fall 2024
Professor: Dr. Smith
Skills: Python, scikit-learn, TensorFlow
Description: Comprehensive introduction to ML algorithms...

Course #2:
Code: CS 4347
Name: Database Systems
Credits: 3
Difficulty: intermediate
Prerequisites: CS 3341
Skills: SQL, Database Design, PostgreSQL
Description: Design and implementation of database systems...

=== SEMESTER PLAN ===
- Fall 2024 (12 credits): CS 4375, CS 4347, MATH 2418
- Spring 2025 (15 credits): CS 4384, CS 4351, CS 4348
- Fall 2025 (12 credits): CS 4390, CS 4349, CS 4352

=== PREREQUISITES ===
- CS 3341 (required for: CS 4375, CS 4347, CS 4384)
- MATH 2418 (required for: CS 4375, CS 4351)
- CS 4347 (required for: CS 4348, CS 4349)

=== SKILL AREAS ===
- Machine Learning (high importance): CS 4375, CS 4384
- Database Systems (medium importance): CS 4347, CS 4348
- Software Engineering (high importance): CS 4351, CS 4352

=== ACADEMIC RESOURCES ===
[tutoring] CS Tutoring Center
Free tutoring for all CS courses, located in ECSS 2.4...

[workshop] ML Workshop Series
Monthly workshops on machine learning topics...

[lab] Database Lab
Hands-on database design and implementation...

[club] CS Student Organization
Networking and professional development events...

[certification] AWS Cloud Practitioner
Recommended certification for cloud computing courses..."""

    event = {
        "actionGroup": "validation_tools",
        "function": "validate_course_format",
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


def test_invalid_course_format():
    """Test with invalid course format (missing sections)."""
    print("\n" + "=" * 60)
    print("Testing INVALID course format (missing sections)")
    print("=" * 60)

    invalid_text = """Here are some course recommendations:

CS 4375 - Introduction to Machine Learning
CS 4347 - Database Systems

Some prerequisites:
- CS 3341 is required for CS 4375

That's all the information I have."""

    event = {
        "actionGroup": "validation_tools",
        "function": "validate_course_format",
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


def test_malformed_course_format():
    """Test with malformed course format (wrong structure)."""
    print("\n" + "=" * 60)
    print("Testing MALFORMED course format (wrong structure)")
    print("=" * 60)

    malformed_text = """=== COURSE CATALOG ===

Course #1:
Code: CS 4375
Name: Introduction to Machine Learning
# Missing required fields: Credits, Difficulty

=== SEMESTER PLAN ===
- Fall 2024 (12 credits): CS 4375, CS 4347
# This section is OK

=== PREREQUISITES ===
- CS 3341 (required for: CS 4375, CS 4347)
# This section is OK

=== SKILL AREAS ===
- Machine Learning (invalid importance): CS 4375
# Wrong importance level

=== ACADEMIC RESOURCES ===
[invalid] Some Resource
# Wrong resource type"""

    event = {
        "actionGroup": "validation_tools",
        "function": "validate_course_format",
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
        "function": "validate_course_format",
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
    print("Course Validation Lambda - Local Tests")
    print("=" * 60)

    try:
        test_valid_course_format()
        test_invalid_course_format()
        test_malformed_course_format()
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
