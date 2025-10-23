#!/usr/bin/env python3
"""
AWS Lambda function for Job Market output validation
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


def validate_job_market_format(text: str) -> FormatValidationResult:
    """
    Validate job market data format.

    Expected format:
    === JOB LISTINGS ===
    Job #1:
    Title: ...
    Company: ...
    Location: ...
    Salary: ... (optional)
    Type: ...
    Skills: ...
    Posted: ... (optional)
    Description: ... (optional)

    === HOT ROLES ===
    - Role Name (count openings) [trending up/down/stable]

    === IN-DEMAND SKILLS ===
    - Skill Name (high/medium/low demand, count listings)

    === TOP EMPLOYERS ===
    - Employer Name (count openings, location) or (count openings)

    === MARKET TRENDS ===
    [POSITIVE/NEGATIVE/NEUTRAL] Trend Name
    Description text...
    """
    errors = []
    warnings = []

    # Check for required sections
    required_sections = [
        "=== JOB LISTINGS ===",
        "=== HOT ROLES ===",
        "=== IN-DEMAND SKILLS ===",
        "=== TOP EMPLOYERS ===",
        "=== MARKET TRENDS ===",
    ]

    for section in required_sections:
        if section not in text:
            errors.append(f"Missing required section: {section}")

    # Validate job listings format
    if "=== JOB LISTINGS ===" in text:
        job_pattern = r"Job\s+#\d+:"
        job_matches = re.findall(job_pattern, text)
        if len(job_matches) == 0:
            warnings.append("No job listings found in JOB LISTINGS section")

        # Check for required fields in job listings
        if job_matches:
            for i, match in enumerate(job_matches, 1):
                job_section = text.split(match)[1].split(
                    "Job #" if i < len(job_matches) else "==="
                )[0]
                required_fields = [
                    "Title:",
                    "Company:",
                    "Location:",
                    "Type:",
                    "Skills:",
                ]
                for field in required_fields:
                    if field not in job_section:
                        warnings.append(f"Job #{i} missing field: {field}")

    # Validate hot roles format
    if "=== HOT ROLES ===" in text:
        hot_roles_section = text.split("=== HOT ROLES ===")[1].split("===")[0]
        role_pattern = (
            r"-\s+.+\s+\(\d+\s+openings?\)\s+\[(?:trending\s+)?(up|down|stable)\]"
        )
        role_matches = re.findall(role_pattern, hot_roles_section, re.IGNORECASE)
        if len(role_matches) == 0:
            warnings.append("No properly formatted hot roles found")

    # Validate in-demand skills format
    if "=== IN-DEMAND SKILLS ===" in text:
        skills_section = text.split("=== IN-DEMAND SKILLS ===")[1].split("===")[0]
        skill_pattern = r"-\s+.+\s+\((high|medium|low)\s+demand,\s+\d+\s+listings?\)"
        skill_matches = re.findall(skill_pattern, skills_section, re.IGNORECASE)
        if len(skill_matches) == 0:
            warnings.append("No properly formatted skills found")

    # Validate top employers format
    if "=== TOP EMPLOYERS ===" in text:
        employers_section = text.split("=== TOP EMPLOYERS ===")[1].split("===")[0]
        employer_pattern = r"-\s+.+\s+\(\d+\s+openings?"
        employer_matches = re.findall(
            employer_pattern, employers_section, re.IGNORECASE
        )
        if len(employer_matches) == 0:
            warnings.append("No properly formatted employers found")

    # Validate market trends format
    if "=== MARKET TRENDS ===" in text:
        trends_section = text.split("=== MARKET TRENDS ===")[1]
        trend_pattern = r"\[(POSITIVE|NEGATIVE|NEUTRAL)\]"
        trend_matches = re.findall(trend_pattern, trends_section, re.IGNORECASE)
        if len(trend_matches) == 0:
            warnings.append("No properly formatted market trends found")

    is_valid = len(errors) == 0
    return FormatValidationResult(is_valid, errors, warnings)


def lambda_handler(event, context):
    """
    AWS Lambda handler for job market format validation.

    Event structure:
    {
        "actionGroup": "validation_tools",
        "function": "validate_job_market_format",
        "parameters": [
            {
                "name": "response_text",
                "type": "string",
                "value": "=== JOB LISTINGS ===\nJob #1:\nTitle: ..."
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
    validation_result = validate_job_market_format(response_text)

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
