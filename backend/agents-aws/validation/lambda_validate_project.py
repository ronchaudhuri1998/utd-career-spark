#!/usr/bin/env python3
"""
AWS Lambda function for Project Advisor output validation
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


def validate_project_format(text: str) -> FormatValidationResult:
    """
    Validate project recommendations format.

    Expected format:
    === PROJECT RECOMMENDATIONS ===
    Project #1:
    Title: ...
    Description: ...
    Skills: ...
    Difficulty: beginner/intermediate/advanced
    Estimated Time: ... (optional)
    Category: ... (optional)
    Career Relevance: ... (optional)
    """
    errors = []
    warnings = []

    # Check for required section
    if "=== PROJECT RECOMMENDATIONS ===" not in text and "=== PROJECT ===" not in text:
        errors.append(
            "Missing required section: === PROJECT RECOMMENDATIONS === or === PROJECT ==="
        )

    # Validate project format
    project_pattern = r"Project\s+#\d+:"
    project_matches = re.findall(project_pattern, text)
    if len(project_matches) == 0:
        warnings.append("No projects found in PROJECT RECOMMENDATIONS section")

    # Check for required fields in projects
    if project_matches:
        for i, match in enumerate(project_matches, 1):
            project_section = text.split(match)[1].split(
                "Project #" if i < len(project_matches) else "==="
            )[0]
            required_fields = ["Title:", "Description:", "Skills:", "Difficulty:"]
            for field in required_fields:
                if field not in project_section:
                    warnings.append(f"Project #{i} missing field: {field}")

            # Check difficulty value
            if "Difficulty:" in project_section:
                difficulty_line = [
                    line
                    for line in project_section.split("\n")
                    if line.strip().startswith("Difficulty:")
                ][0]
                if not any(
                    level in difficulty_line.lower()
                    for level in ["beginner", "intermediate", "advanced"]
                ):
                    warnings.append(
                        f"Project #{i} has invalid difficulty level (must be beginner/intermediate/advanced)"
                    )

    is_valid = len(errors) == 0
    return FormatValidationResult(is_valid, errors, warnings)


def lambda_handler(event, context):
    """
    AWS Lambda handler for project advisor format validation.

    Event structure:
    {
        "actionGroup": "validation_tools",
        "function": "validate_project_format",
        "parameters": [
            {
                "name": "response_text",
                "type": "string",
                "value": "=== PROJECT RECOMMENDATIONS ===\nProject #1:\nTitle: ..."
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
    validation_result = validate_project_format(response_text)

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
