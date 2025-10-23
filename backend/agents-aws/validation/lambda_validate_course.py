#!/usr/bin/env python3
"""
AWS Lambda function for Course Catalog output validation
Validates agent responses against the required format
"""

import json
import re
from typing import Dict, List, Optional, Tuple


class FormatValidationResult:
    """Result of format validation."""

    def __init__(
        self, is_valid: bool, errors: List[str] = None, warnings: List[str] = None
    ):
        self.is_valid = is_valid
        self.errors = errors or []
        self.warnings = warnings or []

    def __bool__(self):
        return self.is_valid

    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return {
            "is_valid": self.is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "message": self._get_message(),
        }

    def _get_message(self):
        """Get human-readable message."""
        if self.is_valid:
            msg = "✓ Format is valid"
            if self.warnings:
                msg += f" (with {len(self.warnings)} warnings)"
            return msg
        else:
            return f"✗ Format is invalid: {len(self.errors)} errors, {len(self.warnings)} warnings"


def validate_course_format(text: str) -> FormatValidationResult:
    """
    Validate course data format.

    Expected format:
    === COURSE CATALOG ===
    Course #1:
    Code: ...
    Name: ...
    Credits: ...
    Difficulty: beginner/intermediate/advanced
    Prerequisites: ... or None
    Semester: ... (optional)
    Professor: ... (optional)
    Skills: ... (optional)
    Description: ... (optional)

    === SEMESTER PLAN ===
    - Semester Name (credits credits): course1, course2, course3

    === PREREQUISITES ===
    - Course Code (required for: course1, course2)

    === SKILL AREAS ===
    - Area Name (high/medium/low importance): course1, course2

    === ACADEMIC RESOURCES ===
    [tutoring/workshop/lab/club/certification/other] Resource Name
    Description text...
    """
    errors = []
    warnings = []

    # Check for required sections
    required_sections = [
        "=== COURSE CATALOG ===",
        "=== SEMESTER PLAN ===",
        "=== PREREQUISITES ===",
        "=== SKILL AREAS ===",
        "=== ACADEMIC RESOURCES ===",
    ]

    for section in required_sections:
        if section not in text:
            errors.append(f"Missing required section: {section}")

    # Validate course catalog format
    if "=== COURSE CATALOG ===" in text:
        course_pattern = r"Course\s+#\d+:"
        course_matches = re.findall(course_pattern, text)
        if len(course_matches) == 0:
            warnings.append("No courses found in COURSE CATALOG section")

        # Check for required fields in courses
        if course_matches:
            for i, match in enumerate(course_matches, 1):
                course_section = text.split(match)[1].split(
                    "Course #" if i < len(course_matches) else "==="
                )[0]
                required_fields = ["Code:", "Name:", "Credits:", "Difficulty:"]
                for field in required_fields:
                    if field not in course_section:
                        warnings.append(f"Course #{i} missing field: {field}")

    # Validate semester plan format
    if "=== SEMESTER PLAN ===" in text:
        semester_section = text.split("=== SEMESTER PLAN ===")[1].split("===")[0]
        semester_pattern = r"-\s+.+\s+\(\d+\s+credits?\):"
        semester_matches = re.findall(semester_pattern, semester_section, re.IGNORECASE)
        if len(semester_matches) == 0:
            warnings.append("No properly formatted semester plans found")

    # Validate prerequisites format
    if "=== PREREQUISITES ===" in text:
        prereq_section = text.split("=== PREREQUISITES ===")[1].split("===")[0]
        prereq_pattern = r"-\s+.+\s+\(required for:"
        prereq_matches = re.findall(prereq_pattern, prereq_section, re.IGNORECASE)
        if len(prereq_matches) == 0:
            warnings.append("No properly formatted prerequisites found")

    # Validate skill areas format
    if "=== SKILL AREAS ===" in text:
        skill_section = text.split("=== SKILL AREAS ===")[1].split("===")[0]
        skill_pattern = r"-\s+.+\s+\((high|medium|low)\s+importance\):"
        skill_matches = re.findall(skill_pattern, skill_section, re.IGNORECASE)
        if len(skill_matches) == 0:
            warnings.append("No properly formatted skill areas found")

    # Validate academic resources format
    if "=== ACADEMIC RESOURCES ===" in text:
        resources_section = text.split("=== ACADEMIC RESOURCES ===")[1]
        resource_pattern = r"\[(tutoring|workshop|lab|club|certification|other)\]"
        resource_matches = re.findall(
            resource_pattern, resources_section, re.IGNORECASE
        )
        if len(resource_matches) == 0:
            warnings.append("No properly formatted academic resources found")

    is_valid = len(errors) == 0
    return FormatValidationResult(is_valid, errors, warnings)


def lambda_handler(event, context):
    """
    AWS Lambda handler for course catalog format validation.

    Event structure:
    {
        "actionGroup": "validation_tools",
        "function": "validate_course_format",
        "parameters": [
            {
                "name": "response_text",
                "type": "string",
                "value": "=== COURSE CATALOG ===\nCourse #1:\nCode: ..."
            }
        ]
    }
    """
    print(f"Received event: {json.dumps(event)}")

    # Extract response text from parameters
    response_text = ""
    parameters = event.get("parameters", [])
    for param in parameters:
        if param.get("name") == "response_text":
            response_text = param.get("value", "")
            break

    if not response_text:
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": event.get("actionGroup", ""),
                "function": event.get("function", ""),
                "functionResponse": {
                    "responseBody": {
                        "TEXT": {
                            "body": json.dumps(
                                {
                                    "is_valid": False,
                                    "errors": ["No response_text parameter provided"],
                                    "warnings": [],
                                    "message": "✗ No response text provided for validation",
                                }
                            )
                        }
                    }
                },
            },
        }

    # Validate the format
    validation_result = validate_course_format(response_text)

    # Return in Bedrock agent format
    return {
        "messageVersion": "1.0",
        "response": {
            "actionGroup": event.get("actionGroup", ""),
            "function": event.get("function", ""),
            "functionResponse": {
                "responseBody": {
                    "TEXT": {"body": json.dumps(validation_result.to_dict())}
                }
            },
        },
    }
