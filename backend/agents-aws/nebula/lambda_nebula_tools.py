#!/usr/bin/env python3
"""
AWS Lambda function for Nebula API tools
Handles UTD course data retrieval from Nebula API
"""

import json
import os
import requests
from typing import List, Dict, Tuple, Optional


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
        "parameters": {"subject_prefix": "...", "course_number": "...", "first_name": "...", "last_name": "...", "prefix": "...", "number": "..."}
    }
    """
    print(f"Received event: {json.dumps(event)}")

    # Extract action group and function from event
    action_group = event.get("actionGroup", "")
    function_name = event.get("function", "")
    parameters = event.get("parameters", {})

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
        result = {"grades": grades, "summary": summary, "count": len(grades)}

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
