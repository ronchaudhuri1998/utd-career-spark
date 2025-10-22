#!/usr/bin/env python3
"""
AWS Lambda function for Course Catalog tools
Handles course data retrieval and analysis
"""

import json
import re
from typing import List, Dict, Tuple


def get_course_catalog() -> Tuple[List[Dict], str]:
    """
    Retrieves course catalog data from UTD course database.
    Returns: (list of courses, summary)
    """
    try:
        # Mock course data - in production, this would connect to UTD's course database
        courses = [
            {
                "code": "CS 1337",
                "name": "Computer Science I",
                "credits": 3,
                "description": "Introduction to programming concepts and problem solving",
                "prerequisites": [],
                "department": "Computer Science",
            },
            {
                "code": "CS 1336",
                "name": "Computer Science II",
                "credits": 3,
                "description": "Object-oriented programming and data structures",
                "prerequisites": ["CS 1337"],
                "department": "Computer Science",
            },
            {
                "code": "CS 3345",
                "name": "Data Structures and Algorithms",
                "credits": 3,
                "description": "Advanced data structures and algorithm analysis",
                "prerequisites": ["CS 1336", "MATH 2414"],
                "department": "Computer Science",
            },
            {
                "code": "CS 4347",
                "name": "Database Systems",
                "credits": 3,
                "description": "Database design, implementation, and management",
                "prerequisites": ["CS 3345"],
                "department": "Computer Science",
            },
            {
                "code": "CS 4352",
                "name": "Human Computer Interactions",
                "credits": 3,
                "description": "User interface design and usability principles",
                "prerequisites": ["CS 3345"],
                "department": "Computer Science",
            },
            {
                "code": "MATH 2414",
                "name": "Calculus II",
                "credits": 4,
                "description": "Integration techniques and applications",
                "prerequisites": ["MATH 2413"],
                "department": "Mathematics",
            },
            {
                "code": "MATH 2413",
                "name": "Calculus I",
                "credits": 4,
                "description": "Limits, derivatives, and applications",
                "prerequisites": [],
                "department": "Mathematics",
            },
        ]

        return (courses, f"Retrieved {len(courses)} courses from catalog")

    except Exception as e:
        return ([], f"Error retrieving course catalog: {str(e)}")


def search_courses_by_keyword(keyword: str) -> Tuple[List[Dict], str]:
    """
    Search courses by keyword in name, description, or code.
    Returns: (list of matching courses, summary)
    """
    try:
        courses, _ = get_course_catalog()
        keyword_lower = keyword.lower()

        matching_courses = []
        for course in courses:
            if (
                keyword_lower in course["name"].lower()
                or keyword_lower in course["description"].lower()
                or keyword_lower in course["code"].lower()
            ):
                matching_courses.append(course)

        return (
            matching_courses,
            f"Found {len(matching_courses)} courses matching '{keyword}'",
        )

    except Exception as e:
        return ([], f"Error searching courses: {str(e)}")


def get_course_prerequisites(course_code: str) -> Tuple[List[str], str]:
    """
    Get prerequisites for a specific course.
    Returns: (list of prerequisite course codes, summary)
    """
    try:
        courses, _ = get_course_catalog()

        for course in courses:
            if course["code"].upper() == course_code.upper():
                return (
                    course["prerequisites"],
                    f"Found {len(course['prerequisites'])} prerequisites for {course_code}",
                )

        return ([], f"Course {course_code} not found")

    except Exception as e:
        return ([], f"Error getting prerequisites: {str(e)}")


def get_courses_by_department(department: str) -> Tuple[List[Dict], str]:
    """
    Get all courses in a specific department.
    Returns: (list of courses, summary)
    """
    try:
        courses, _ = get_course_catalog()
        department_lower = department.lower()

        dept_courses = []
        for course in courses:
            if department_lower in course["department"].lower():
                dept_courses.append(course)

        return (
            dept_courses,
            f"Found {len(dept_courses)} courses in {department} department",
        )

    except Exception as e:
        return ([], f"Error getting department courses: {str(e)}")


def lambda_handler(event, context):
    """
    AWS Lambda handler for Bedrock Agent action group.

    Event structure from Bedrock:
    {
        "actionGroup": "course_tools",
        "function": "get_course_catalog" | "search_courses_by_keyword" | "get_course_prerequisites" | "get_courses_by_department",
        "parameters": {"keyword": "..."} | {"course_code": "..."} | {"department": "..."}
    }
    """
    print(f"Received event: {json.dumps(event)}")

    # Extract action group and function from event
    action_group = event.get("actionGroup", "")
    function_name = event.get("function", "")
    parameters = event.get("parameters", {})

    # Execute the appropriate function
    if function_name == "get_course_catalog":
        courses, summary = get_course_catalog()
        result = {"courses": courses, "summary": summary, "count": len(courses)}
    elif function_name == "search_courses_by_keyword":
        keyword = parameters.get("keyword", "")
        courses, summary = search_courses_by_keyword(keyword)
        result = {"courses": courses, "summary": summary, "count": len(courses)}
    elif function_name == "get_course_prerequisites":
        course_code = parameters.get("course_code", "")
        prerequisites, summary = get_course_prerequisites(course_code)
        result = {
            "prerequisites": prerequisites,
            "summary": summary,
            "count": len(prerequisites),
        }
    elif function_name == "get_courses_by_department":
        department = parameters.get("department", "")
        courses, summary = get_courses_by_department(department)
        result = {"courses": courses, "summary": summary, "count": len(courses)}
    else:
        result = {"error": f"Unknown function: {function_name}"}

    # Return in the format Bedrock expects
    return {
        "messageVersion": "1.0",
        "response": {
            "actionGroup": action_group,
            "function": function_name,
            "functionResponse": {
                "responseBody": {"TEXT": {"body": json.dumps(result)}}
            },
        },
    }
