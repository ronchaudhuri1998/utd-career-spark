"""
Format validation utility for agent outputs.

This module provides validation functions to verify that agent outputs
match the expected formats required by the frontend parsers.
"""

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

    def __str__(self):
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


def validate_agent_output(agent_type: str, text: str) -> FormatValidationResult:
    """
    Validate agent output based on agent type.

    Args:
        agent_type: One of "job_market", "course", "project"
        text: The agent output text to validate

    Returns:
        FormatValidationResult with validation status and any errors/warnings
    """
    validators = {
        "job_market": validate_job_market_format,
        "course": validate_course_format,
        "project": validate_project_format,
    }

    if agent_type not in validators:
        return FormatValidationResult(
            False,
            [
                f"Unknown agent type: {agent_type}. Must be one of: {', '.join(validators.keys())}"
            ],
        )

    return validators[agent_type](text)


# Example usage
if __name__ == "__main__":
    # Test with mock data
    test_job_market = """=== JOB LISTINGS ===

Job #1:
Title: Software Engineer
Company: Tech Corp
Location: Dallas, TX
Salary: $80k-120k
Type: Full-time
Skills: React, Node.js, TypeScript
Posted: 2 days ago
Description: Looking for a talented engineer...

=== HOT ROLES ===
- Software Engineer (150 openings) [trending up]
- Frontend Developer (85 openings) [stable]

=== IN-DEMAND SKILLS ===
- React (high demand, 200 listings)
- Python (medium demand, 120 listings)

=== TOP EMPLOYERS ===
- Tech Corp (25 openings, Dallas TX)
- Innovation Labs (18 openings)

=== MARKET TRENDS ===
[POSITIVE] AI/ML Integration
Increasing demand for AI and machine learning skills...

[NEUTRAL] Remote Work Normalization
More companies offering remote options...
"""

    result = validate_agent_output("job_market", test_job_market)
    print(f"Job Market Validation: {result}")
    if result.errors:
        print("Errors:", result.errors)
    if result.warnings:
        print("Warnings:", result.warnings)

