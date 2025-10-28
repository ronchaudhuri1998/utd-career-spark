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
    === TOP COMPANIES HIRING ===
    - [Company Name]
    - [Company Name]
    [List 3-5 companies]

    === IN-DEMAND SKILLS ===
    - [Skill Name] (trending up/down/stable)
    - [Skill Name] (trending up/down/stable)
    [Include 5-8 skills]

    === MARKET INSIGHTS ===
    [2-3 sentence summary]
    """
    errors = []
    warnings = []

    # Check for required sections
    required_sections = [
        "=== TOP COMPANIES HIRING ===",
        "=== IN-DEMAND SKILLS ===",
        "=== MARKET INSIGHTS ===",
    ]

    for section in required_sections:
        if section not in text:
            errors.append(f"Missing required section: {section}")

    # Validate companies section
    if "=== TOP COMPANIES HIRING ===" in text:
        companies_section = text.split("=== TOP COMPANIES HIRING ===")[1].split("===")[0]
        # Check for bullet points
        if not any(line.strip().startswith("- ") for line in companies_section.split("\n")):
            warnings.append("No companies found in TOP COMPANIES HIRING section")

    # Validate skills section
    if "=== IN-DEMAND SKILLS ===" in text:
        skills_section = text.split("=== IN-DEMAND SKILLS ===")[1].split("===")[0]
        # Check for skills with trend indicators
        skill_pattern = r"-\s+.+\s+\(trending\s+(up|down|stable)\)"
        skill_matches = re.findall(skill_pattern, skills_section, re.IGNORECASE)
        if len(skill_matches) == 0:
            warnings.append("No properly formatted skills with trend indicators found")

    # Validate market insights section
    if "=== MARKET INSIGHTS ===" in text:
        insights_section = text.split("=== MARKET INSIGHTS ===")[1]
        # Check for meaningful content (at least some text)
        if len(insights_section.strip()) < 20:
            warnings.append("MARKET INSIGHTS section seems too short")

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
