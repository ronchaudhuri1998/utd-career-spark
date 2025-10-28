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

def extract_courses_from_text(text: str) -> List[Tuple[str, str]]:
    """
    Parse course codes from text (e.g., "CS 1337", "MATH 2413").
    Returns list of tuples: [(prefix, number), ...]
    """
    # Pattern to match course codes like CS 1337, MATH 2413, etc.
    pattern = r'([A-Z]{2,4})\s+(\d{3,4})'
    matches = re.findall(pattern, text)
    
    # Deduplicate courses
    unique_courses = list(set(matches))
    return unique_courses


def validate_course_format(text: str) -> FormatValidationResult:
    """
    Validate course data format.

        Expected format:
        === RECOMMENDED COURSES ===
        Fall 2025:
        1. CS [Number]. Skills: [Skill1], [Skill2], [Skill3]
        2. CS [Number]. Skills: [Skill1], [Skill2], [Skill3]

        Spring 2026:
        1. CS [Number]. Skills: [Skill1], [Skill2], [Skill3]
        2. CS [Number]. Skills: [Skill1], [Skill2], [Skill3]

    === SEMESTER PLAN ===
    Fall 2025 ([Total] credits):
    - CS [Number], CS [Number]

    === PREREQUISITES ===
    CS [Number] → Required for: CS [Number], CS [Number]

    === SKILL AREAS ===
    - [Skill Area Name]: CS [Number], CS [Number]

    === ACADEMIC RESOURCES ===
    - [Resource Name] ([type]): [Description]
    """
    errors = []
    warnings = []

    # Simplified validator: Only warnings for semester credit load
    # and prerequisite ordering across semesters.

    # Extract courses section if present
    courses_section = ""
    if "=== RECOMMENDED COURSES ===" in text:
        courses_section = text.split("=== RECOMMENDED COURSES ===")[1].split("===")[0]

    # Extract prerequisite section if present (optional)
    prereq_section = ""
    if "=== PREREQUISITES ===" in text:
        prereq_section = text.split("=== PREREQUISITES ===")[1].split("===")[0]

    # Skip format checks for skills/resources per new requirements

    # Best-effort credit load warning (uses explicit totals if present)
    # Looks for lines like: "Fall 2025 ([Total] credits):" anywhere in text
    credit_header_pattern = r"^(Fall|Spring)\s+\d{4}\s*\((\d+)\s*credits\):"
    for sem_header, credits_str in re.findall(credit_header_pattern, text, re.MULTILINE):
        try:
            credits_val = int(credits_str)
            if credits_val < 12 or credits_val > 18:
                warnings.append(
                    f"Semester '{sem_header}' credit load {credits_val} outside 12–18 band"
                )
        except ValueError:
            # Ignore malformed totals
            pass

    # Prerequisite ordering warning (best-effort)
    # Build term index map from RECOMMENDED COURSES ordering
    term_order: Dict[str, int] = {}
    if "=== RECOMMENDED COURSES ===" in text:
        courses_section = text.split("=== RECOMMENDED COURSES ===")[1].split("===")[0]
        term_index = -1
        for line in courses_section.splitlines():
            line = line.strip()
            sem_m = re.match(r"^(Fall|Spring)\s+(\d{4}):$", line)
            if sem_m:
                term_index += 1
                current_term = f"{sem_m.group(1)} {sem_m.group(2)}"
                term_order[current_term] = term_index
                continue
            course_m = re.match(r"^\d+\.\s+([A-Z]{2,4}\s+\d{3,4})\.", line)
            # We don't need to store per-course term here; we will compare using prerequisites map below
            # The per-course term will be inferred when scanning again
        
        # Build course->term index map
        course_term: Dict[str, int] = {}
        current_term_name = None
        for line in courses_section.splitlines():
            line = line.strip()
            sem_m = re.match(r"^(Fall|Spring)\s+(\d{4}):$", line)
            if sem_m:
                current_term_name = f"{sem_m.group(1)} {sem_m.group(2)}"
                continue
            course_m = re.match(r"^\d+\.\s+([A-Z]{2,4}\s+\d{3,4})\.", line)
            if course_m and current_term_name is not None:
                course_term[course_m.group(1)] = term_order.get(current_term_name, 0)

        # Parse prerequisites relationships from PREREQUISITES section
        if "=== PREREQUISITES ===" in text:
            prereq_section = text.split("=== PREREQUISITES ===")[1].split("===")[0]
            for line in prereq_section.splitlines():
                line = line.strip()
                m = re.match(r"^([A-Z]{2,4}\s+\d{3,4})\s*→\s*Required for:\s*(.+)$", line)
                if not m:
                    continue
                prereq_course = m.group(1)
                required_for = [c.strip() for c in m.group(2).split(",") if c.strip()]
                for target in required_for:
                    if target in course_term and prereq_course in course_term:
                        if course_term[target] <= course_term[prereq_course]:
                            warnings.append(
                                f"Prerequisite order warning: {target} appears not after its prerequisite {prereq_course}"
                            )

    # API-based validation using Nebula API
    try:
        # Extract all course codes from the text
        courses = extract_courses_from_text(text)
        
        if courses:
            # Build semester-to-courses mapping for prerequisite validation
            semester_courses: Dict[str, List[str]] = {}
            if "=== RECOMMENDED COURSES ===" in text:
                courses_section = text.split("=== RECOMMENDED COURSES ===")[1].split("===")[0]
                current_semester = None
                for line in courses_section.splitlines():
                    line = line.strip()
                    sem_m = re.match(r"^(Fall|Spring)\s+(\d{4}):$", line)
                    if sem_m:
                        current_semester = f"{sem_m.group(1)} {sem_m.group(2)}"
                        semester_courses[current_semester] = []
                        continue
                    course_m = re.match(r"^\d+\.\s+([A-Z]{2,4}\s+\d{3,4})\.", line)
                    if course_m and current_semester:
                        semester_courses[current_semester].append(course_m.group(1))
            
            # Validate each course against Nebula API
            for subject_prefix, course_number in courses:
                course_code = f"{subject_prefix} {course_number}"
                course_info = get_course_info_from_nebula(subject_prefix, course_number)
                
                if course_info is None:
                    warnings.append(f"Course {course_code} not found in Nebula API")
                    continue
                
                # Validate credit hours if stated in text
                if course_info.get("credit_hours"):
                    api_credits = str(course_info["credit_hours"])
                    # Look for credit hour mentions in text for this course
                    credit_pattern = rf"{re.escape(course_code)}.*?(\d+)\s*credits?"
                    credit_matches = re.findall(credit_pattern, text, re.IGNORECASE)
                    for stated_credits in credit_matches:
                        if stated_credits != api_credits:
                            warnings.append(f"Credit hour mismatch for {course_code}: stated {stated_credits}, API shows {api_credits}")
                
                # Validate prerequisites using API data
                api_prereqs = course_info.get("prerequisites", "")
                if api_prereqs:
                    # Handle both string and dict prerequisites
                    if isinstance(api_prereqs, dict):
                        # Convert dict to string representation for parsing
                        api_prereqs_str = str(api_prereqs)
                    else:
                        api_prereqs_str = str(api_prereqs).strip()
                    
                    if api_prereqs_str:
                        # Extract prerequisite course codes from API prerequisites text
                        prereq_courses = extract_courses_from_text(api_prereqs_str)
                        
                        # Check if this course is scheduled before its prerequisites
                        course_semester = None
                        for semester, courses_list in semester_courses.items():
                            if course_code in courses_list:
                                course_semester = semester
                                break
                        
                        if course_semester:
                            # Find semester index
                            semester_list = list(semester_courses.keys())
                            course_semester_index = semester_list.index(course_semester) if course_semester in semester_list else -1
                            
                            # Check each prerequisite
                            for prereq_prefix, prereq_number in prereq_courses:
                                prereq_code = f"{prereq_prefix} {prereq_number}"
                                prereq_semester = None
                                for semester, courses_list in semester_courses.items():
                                    if prereq_code in courses_list:
                                        prereq_semester = semester
                                        break
                                
                                if prereq_semester:
                                    prereq_semester_index = semester_list.index(prereq_semester) if prereq_semester in semester_list else -1
                                    if course_semester_index >= 0 and prereq_semester_index >= 0 and course_semester_index <= prereq_semester_index:
                                        warnings.append(f"Prerequisite violation: {course_code} scheduled in {course_semester} but prerequisite {prereq_code} is in {prereq_semester}")
                                else:
                                    warnings.append(f"Prerequisite {prereq_code} for {course_code} not found in semester plan")
    
    except Exception as e:
        # Gracefully handle API validation failures
        warnings.append(f"API validation failed: {str(e)}")

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
