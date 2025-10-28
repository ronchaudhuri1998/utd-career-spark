#!/usr/bin/env python3
"""
AWS Lambda function for Nebula API tools
Handles UTD course data retrieval from Nebula API
"""

import json
import os
import requests
from typing import List, Dict, Tuple, Optional


def calculate_grade_stats(grade_distribution: List[int]) -> Dict:
    """Convert grade array [A+, A, A-, B+, ...] to summary stats"""
    if not grade_distribution or sum(grade_distribution) == 0:
        return {"average_gpa": None, "pass_rate": None, "total_students": 0}
    
    grade_points = [4.0, 4.0, 3.67, 3.33, 3.0, 2.67, 2.33, 2.0, 1.67, 1.33, 1.0, 0.67, 0.0, 0.0]
    total_students = sum(grade_distribution)
    weighted_sum = sum(points * count for points, count in zip(grade_points, grade_distribution))
    avg_gpa = weighted_sum / total_students if total_students > 0 else 0.0
    
    # Pass = C or better (first 9 grades)
    passing = sum(grade_distribution[:9])
    pass_rate = (passing / total_students * 100) if total_students > 0 else 0.0
    
    return {
        "average_gpa": round(avg_gpa, 2),
        "pass_rate": round(pass_rate, 1),
        "total_students": total_students
    }

def filter_section_data(section: Dict) -> Dict:
    """Extract minimal fields from section object"""
    professor_names = []
    if section.get("professor_details"):
        professor_names = [
            f"{p.get('first_name', '')} {p.get('last_name', '')}"
            for p in section["professor_details"]
        ]
    
    course_title = ""
    if section.get("course_details") and len(section["course_details"]) > 0:
        course_title = section["course_details"][0].get("title", "")
    
    grade_stats = calculate_grade_stats(section.get("grade_distribution", []))
    
    return {
        "semester": section.get("academic_session", {}).get("name", ""),
        "section_number": section.get("section_number", ""),
        "professors": professor_names,
        "course_title": course_title,
        "grade_stats": grade_stats
    }

def filter_course_info(course: Dict) -> Dict:
    """Extract minimal course information"""
    return {
        "title": course.get("title", ""),
        "description": course.get("description", ""),
        "credit_hours": course.get("credit_hours", ""),
        "prerequisites": course.get("prerequisites", "")
    }

def filter_professor_info(prof: Dict) -> Dict:
    """Extract minimal professor information"""
    return {
        "name": f"{prof.get('first_name', '')} {prof.get('last_name', '')}",
        "email": prof.get("email", ""),
        "titles": prof.get("titles", [])
    }


def get_course_sections_trends(
    subject_prefix: str, course_number: str
) -> Tuple[List[Dict], str]:
    """
    Get historical section data with grade distributions and professor information.
    Returns: (list of sections with trends, summary)
    """
    try:
        api_key = os.getenv("NEBULA_API_KEY")
        if not api_key:
            return ([], "NEBULA_API_KEY environment variable not set")

        url = "https://api.utdnebula.com/course/sections/trends"
        params = {"subject_prefix": subject_prefix, "course_number": course_number}
        headers = {"x-api-key": api_key, "Accept": "application/json"}

        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()

        data = response.json()
        if data.get("message") == "error":
            return ([], f"API error: {data.get('data', 'Unknown error')}")

        sections = data.get("data", [])
        if sections is None:
            sections = []
        
        # Filter section data to keep only essential fields
        sections = [filter_section_data(s) for s in sections]
        
        return (
            sections,
            f"Retrieved {len(sections)} sections for {subject_prefix} {course_number}",
        )

    except requests.exceptions.RequestException as e:
        return ([], f"Request error: {str(e)}")
    except Exception as e:
        return ([], f"Error retrieving course sections: {str(e)}")


def get_professor_sections_trends(
    first_name: str, last_name: str
) -> Tuple[List[Dict], str]:
    """
    Get all sections a specific professor has taught with grade distributions.
    Returns: (list of professor sections, summary)
    """
    try:
        api_key = os.getenv("NEBULA_API_KEY")
        if not api_key:
            return ([], "NEBULA_API_KEY environment variable not set")

        url = "https://api.utdnebula.com/professor/sections/trends"
        params = {"first_name": first_name, "last_name": last_name}
        headers = {"x-api-key": api_key, "Accept": "application/json"}

        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()

        data = response.json()
        if data.get("message") == "error":
            return ([], f"API error: {data.get('data', 'Unknown error')}")

        sections = data.get("data", [])
        if sections is None:
            sections = []
        
        # Filter section data to keep only essential fields
        sections = [filter_section_data(s) for s in sections]
        
        return (
            sections,
            f"Retrieved {len(sections)} sections for Professor {first_name} {last_name}",
        )

    except requests.exceptions.RequestException as e:
        return ([], f"Request error: {str(e)}")
    except Exception as e:
        return ([], f"Error retrieving professor sections: {str(e)}")


def get_grades_by_semester(
    prefix: str = None,
    number: str = None,
    first_name: str = None,
    last_name: str = None,
) -> Tuple[List[Dict], str]:
    """
    Get grade distribution data for specific courses or professors in particular semesters.
    Returns: (list of grade data, summary)
    """
    try:
        api_key = os.getenv("NEBULA_API_KEY")
        if not api_key:
            return ([], "NEBULA_API_KEY environment variable not set")

        # Validate that at least one parameter is provided
        if not any([prefix, number, first_name, last_name]):
            return (
                [],
                "At least one parameter (prefix, number, first_name, last_name) is required",
            )

        url = "https://api.utdnebula.com/grades/semester"
        params = {}
        if prefix:
            params["prefix"] = prefix
        if number:
            params["number"] = number
        if first_name:
            params["first_name"] = first_name
        if last_name:
            params["last_name"] = last_name

        headers = {"x-api-key": api_key, "Accept": "application/json"}

        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()

        data = response.json()
        if data.get("message") == "error":
            return ([], f"API error: {data.get('data', 'Unknown error')}")

        grades = data.get("data", [])
        if grades is None:
            grades = []
        return (grades, f"Retrieved {len(grades)} grade records")

    except requests.exceptions.RequestException as e:
        return ([], f"Request error: {str(e)}")
    except Exception as e:
        return ([], f"Error retrieving grades: {str(e)}")


def get_course_information(subject_prefix: str, course_number: str) -> Tuple[Dict, str]:
    """
    Get basic course metadata like title, description, prerequisites, and core flags.
    Returns: (course information dict, summary)
    """
    try:
        api_key = os.getenv("NEBULA_API_KEY")
        if not api_key:
            return ({}, "NEBULA_API_KEY environment variable not set")

        url = "https://api.utdnebula.com/course"
        params = {"subject_prefix": subject_prefix, "course_number": course_number}
        headers = {"x-api-key": api_key, "Accept": "application/json"}

        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()

        data = response.json()
        if data.get("message") == "error":
            return ({}, f"API error: {data.get('data', 'Unknown error')}")

        course_info = data.get("data", {})
        if course_info is None:
            course_info = {}
        
        # API may return a list - take first item if so
        if isinstance(course_info, list) and len(course_info) > 0:
            course_info = course_info[0]
        elif isinstance(course_info, list):
            course_info = {}
        
        # Filter course info to keep only essential fields
        if course_info and isinstance(course_info, dict):
            course_info = filter_course_info(course_info)
        else:
            course_info = {}
        
        return (
            course_info,
            f"Retrieved course information for {subject_prefix} {course_number}",
        )

    except requests.exceptions.RequestException as e:
        return ({}, f"Request error: {str(e)}")
    except Exception as e:
        return ({}, f"Error retrieving course information: {str(e)}")


def get_professor_information(first_name: str, last_name: str) -> Tuple[Dict, str]:
    """
    Get professor details, titles, and basic information.
    Returns: (professor information dict, summary)
    """
    try:
        api_key = os.getenv("NEBULA_API_KEY")
        if not api_key:
            return ({}, "NEBULA_API_KEY environment variable not set")

        url = "https://api.utdnebula.com/professor"
        params = {"first_name": first_name, "last_name": last_name}
        headers = {"x-api-key": api_key, "Accept": "application/json"}

        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()

        data = response.json()
        if data.get("message") == "error":
            return ({}, f"API error: {data.get('data', 'Unknown error')}")

        professor_info = data.get("data", {})
        if professor_info is None:
            professor_info = {}
        
        # API may return a list - take first item if so
        if isinstance(professor_info, list) and len(professor_info) > 0:
            professor_info = professor_info[0]
        elif isinstance(professor_info, list):
            professor_info = {}
        
        # Filter professor info to keep only essential fields
        if professor_info and isinstance(professor_info, dict):
            professor_info = filter_professor_info(professor_info)
        else:
            professor_info = {}
        
        return (
            professor_info,
            f"Retrieved professor information for {first_name} {last_name}",
        )

    except requests.exceptions.RequestException as e:
        return ({}, f"Request error: {str(e)}")
    except Exception as e:
        return ({}, f"Error retrieving professor information: {str(e)}")


def get_course_dashboard_data(
    subject_prefix: str, course_number: str
) -> Tuple[Dict, str]:
    """
    Get comprehensive course dashboard data combining course info and trends.
    Returns: (dashboard data dict, summary)
    """
    try:
        # Get course information
        course_info, course_summary = get_course_information(
            subject_prefix, course_number
        )

        # Get course sections trends
        sections_trends, trends_summary = get_course_sections_trends(
            subject_prefix, course_number
        )

        # Combine the data
        dashboard_data = {
            "course_info": course_info,
            "sections_trends": sections_trends,
            "summary": {
                "course_info_summary": course_summary,
                "trends_summary": trends_summary,
            },
        }

        return (
            dashboard_data,
            f"Retrieved comprehensive dashboard data for {subject_prefix} {course_number}",
        )

    except Exception as e:
        return ({}, f"Error retrieving dashboard data: {str(e)}")


def get_professor_dashboard_data(first_name: str, last_name: str) -> Tuple[Dict, str]:
    """
    Get comprehensive professor dashboard data combining professor info and teaching history.
    Returns: (dashboard data dict, summary)
    """
    try:
        # Get professor information
        professor_info, professor_summary = get_professor_information(
            first_name, last_name
        )

        # Get professor sections trends
        sections_trends, trends_summary = get_professor_sections_trends(
            first_name, last_name
        )

        # Combine the data
        dashboard_data = {
            "professor_info": professor_info,
            "sections_trends": sections_trends,
            "summary": {
                "professor_info_summary": professor_summary,
                "trends_summary": trends_summary,
            },
        }

        return (
            dashboard_data,
            f"Retrieved comprehensive dashboard data for Professor {first_name} {last_name}",
        )

    except Exception as e:
        return ({}, f"Error retrieving professor dashboard data: {str(e)}")


def lambda_handler(event, context):
    """
    AWS Lambda handler for Bedrock Agent action group.

    Event structure from Bedrock:
    {
        "actionGroup": "nebula_tools",
        "function": "get_course_sections_trends" | "get_professor_sections_trends" | "get_grades_by_semester" | "get_course_information" | "get_professor_information" | "get_course_dashboard_data" | "get_professor_dashboard_data",
        "parameters": [{"name": "subject_prefix", "type": "string", "value": "..."}, ...]
    }
    """
    print(f"Received event: {json.dumps(event)}")

    # Extract action group and function from event
    action_group = event.get("actionGroup", "")
    function_name = event.get("function", "")
    parameters_list = event.get("parameters", [])

    # Convert Bedrock parameter format to dictionary
    parameters = {}
    for param in parameters_list:
        if isinstance(param, dict) and "name" in param and "value" in param:
            parameters[param["name"]] = param["value"]

    # Execute the appropriate function
    if function_name == "get_course_sections_trends":
        subject_prefix = parameters.get("subject_prefix", "")
        course_number = parameters.get("course_number", "")
        sections, summary = get_course_sections_trends(subject_prefix, course_number)
        result = {"sections": sections, "summary": summary, "count": len(sections)}

    elif function_name == "get_professor_sections_trends":
        first_name = parameters.get("first_name", "")
        last_name = parameters.get("last_name", "")
        sections, summary = get_professor_sections_trends(first_name, last_name)
        result = {"sections": sections, "summary": summary, "count": len(sections)}

    elif function_name == "get_grades_by_semester":
        prefix = parameters.get("prefix", None)
        number = parameters.get("number", None)
        first_name = parameters.get("first_name", None)
        last_name = parameters.get("last_name", None)
        grades, summary = get_grades_by_semester(prefix, number, first_name, last_name)
        result = {
            "grades": grades,
            "summary": summary,
            "count": len(grades) if grades else 0,
        }

    elif function_name == "get_course_information":
        subject_prefix = parameters.get("subject_prefix", "")
        course_number = parameters.get("course_number", "")
        course_info, summary = get_course_information(subject_prefix, course_number)
        result = {"course_info": course_info, "summary": summary}

    elif function_name == "get_professor_information":
        first_name = parameters.get("first_name", "")
        last_name = parameters.get("last_name", "")
        professor_info, summary = get_professor_information(first_name, last_name)
        result = {"professor_info": professor_info, "summary": summary}

    elif function_name == "get_course_dashboard_data":
        subject_prefix = parameters.get("subject_prefix", "")
        course_number = parameters.get("course_number", "")
        dashboard_data, summary = get_course_dashboard_data(
            subject_prefix, course_number
        )
        result = {"dashboard_data": dashboard_data, "summary": summary}

    elif function_name == "get_professor_dashboard_data":
        first_name = parameters.get("first_name", "")
        last_name = parameters.get("last_name", "")
        dashboard_data, summary = get_professor_dashboard_data(first_name, last_name)
        result = {"dashboard_data": dashboard_data, "summary": summary}

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
