#!/usr/bin/env python3
"""
AWS Lambda function for UTD Course Catalog browsing
Handles web scraping of UTD catalog pages to get degree requirements and course information
"""

import json
import os
import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Optional, Tuple
import logging
import re
from urllib.parse import urljoin, urlparse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_catalog_page(url: str) -> Tuple[Optional[BeautifulSoup], str]:
    """Fetch and parse a catalog page"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
        }
        
        logger.info(f"Fetching URL: {url}")
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        return soup, "Success"
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error for {url}: {str(e)}")
        return None, f"Request error: {str(e)}"
    except Exception as e:
        logger.error(f"Error parsing {url}: {str(e)}")
        return None, f"Parsing error: {str(e)}"

def find_program_link(soup: BeautifulSoup, major_name: str, degree_type: str) -> Optional[str]:
    """Find the link to a specific program page"""
    try:
        # Look for links that contain the major name and degree type
        links = soup.find_all('a', href=True)
        
        # Common patterns for program links
        patterns = [
            f"{major_name.lower()}",
            f"{major_name.lower().replace(' ', '-')}",
            f"{major_name.lower().replace(' ', '_')}",
        ]
        
        for link in links:
            href = link.get('href', '').lower()
            text = link.get_text().lower()
            
            # Check if link text or href contains the major name
            for pattern in patterns:
                if pattern in href or pattern in text:
                    # Check if degree type is mentioned
                    if degree_type.lower() in text or degree_type.lower() in href:
                        return urljoin("https://catalog.utdallas.edu/2025/undergraduate/programs/", link['href'])
        
        # Fallback: look for any link that might be the program
        for link in links:
            href = link.get('href', '').lower()
            text = link.get_text().lower()
            if major_name.lower() in text and ('bs' in text or 'ba' in text or 'bachelor' in text):
                return urljoin("https://catalog.utdallas.edu/2025/undergraduate/programs/", link['href'])
        
        return None
        
    except Exception as e:
        logger.error(f"Error finding program link: {str(e)}")
        return None

def extract_course_codes(text: str) -> List[str]:
    """Extract course codes from text (e.g., CS 1200, MATH 2413)"""
    # Pattern to match course codes like CS 1200, MATH 2413, etc.
    pattern = r'\b([A-Z]{2,4})\s+(\d{4})\b'
    matches = re.findall(pattern, text)
    return [f"{subject} {number}" for subject, number in matches]

def parse_degree_requirements(soup: BeautifulSoup) -> Dict:
    """Parse degree requirements from a program page using scoped selectors and
    robust extraction of course codes from course links and nearby text.

    We avoid building a prerequisite graph from HTML; authoritative prereqs are
    validated via Nebula elsewhere.
    """
    requirements: Dict[str, Optional[List[str]]] = {
        "required_courses": [],
        "elective_courses": [],
        "prerequisites": {},  # left empty on purpose
        "total_credits": None,
        "core_curriculum": [],
        "major_requirements": [],
        "track_options": [],
    }

    try:
        # Scope: curriculum/requirements content blocks
        requirement_selectors = [
            "div.curriculum",
            "div#requirements",
            "section#requirements",
            "div.degree-requirements",
            "div.program-requirements",
        ]

        container = None
        for selector in requirement_selectors:
            el = soup.select_one(selector)
            if el:
                container = el
                break

        if not container:
            # Fallback to main content area to avoid scanning the whole page
            container = soup.select_one("main") or soup

        # Strategy to gather course codes:
        # 1) Prefer anchors linking to course pages
        # 2) Fallback to text within requirement container
        course_codes: List[str] = []

        # 1) Extract from course links
        for a in container.find_all("a", href=True):
            href = a["href"].strip()
            if "/courses/" in href:
                text = a.get_text(" ").strip()
                found = extract_course_codes(text)
                for code in found:
                    course_codes.append(code)

        # 2) Fallback: extract from scoped text (avoid entire page to reduce noise)
        if not course_codes:
            text_content = container.get_text(" ")
            course_codes.extend(extract_course_codes(text_content))

        # Deduplicate while preserving order
        seen = set()
        deduped: List[str] = []
        for code in course_codes:
            if code not in seen:
                seen.add(code)
                deduped.append(code)

        requirements["required_courses"] = deduped

        # Total credits: Look for headings/paragraphs with "semester credit hours"
        credits_text_candidates: List[str] = []
        for el in container.find_all(["h2", "h3", "h4", "p", "li"]):
            t = el.get_text(" ").strip()
            if "credit" in t.lower():
                credits_text_candidates.append(t)
        credit_val: Optional[int] = None
        credit_pattern = re.compile(r"(\d+)\s+(?:semester\s+)?credit\s+hours", re.IGNORECASE)
        for t in credits_text_candidates:
            m = credit_pattern.search(t)
            if m:
                try:
                    n = int(m.group(1))
                    if credit_val is None or n > credit_val:
                        credit_val = n
                except Exception:
                    pass
        requirements["total_credits"] = credit_val

        # Track options: capture headings mentioning common keywords
        track_keywords = ["track", "specialization", "concentration", "option", "emphasis"]
        for hdr in container.find_all(["h3", "h4", "h5"]):
            title = hdr.get_text(" ").strip()
            if any(k in title.lower() for k in track_keywords):
                # Collect nearby list items or paragraph under the heading
                block_text = []
                for sib in hdr.find_all_next(["ul", "ol", "p"], limit=5):
                    block_text.append(sib.get_text(" "))
                codes = extract_course_codes("\n".join(block_text))
                if codes:
                    requirements["track_options"].append({"name": title, "courses": list(dict.fromkeys(codes))})

        # Do not populate prerequisites from HTML; leave empty.
        requirements["prerequisites"] = {}

        return requirements

    except Exception as e:
        logger.error(f"Error parsing degree requirements: {str(e)}")
        return requirements

def get_information(majors: Dict[str, str], minors: Dict[str, str] = None) -> Tuple[Dict, str]:
    """
    Browse UTD Course Catalog to get degree requirements and course information.
    
    Args:
        majors: Dictionary of major names to degree types (e.g., {"Computer Science": "BS"})
        minors: Dictionary of minor names to degree types (optional)
    
    Returns:
        Tuple of (structured data dict, summary message)
    """
    try:
        logger.info(f"Getting information for majors: {majors}, minors: {minors}")
        
        # Base catalog URL
        catalog_url = "https://catalog.utdallas.edu/2025/undergraduate/programs/"
        
        # Fetch main catalog page
        soup, error_msg = get_catalog_page(catalog_url)
        if not soup:
            return ({}, f"Failed to fetch catalog page: {error_msg}")
        
        result = {
            "majors": {},
            "minors": {},
            "catalog_url": catalog_url,
            "timestamp": None
        }
        
        # Process each major
        for major_name, degree_type in majors.items():
            logger.info(f"Processing major: {major_name} {degree_type}")
            
            # Find the program link
            program_url = find_program_link(soup, major_name, degree_type)
            
            if not program_url:
                logger.warning(f"Could not find program link for {major_name} {degree_type}")
                result["majors"][f"{major_name} {degree_type}"] = {
                    "error": f"Program page not found for {major_name} {degree_type}",
                    "url": None,
                    "requirements": {}
                }
                continue
            
            logger.info(f"Found program URL: {program_url}")
            
            # Fetch the program page
            program_soup, program_error = get_catalog_page(program_url)
            if not program_soup:
                result["majors"][f"{major_name} {degree_type}"] = {
                    "error": f"Failed to fetch program page: {program_error}",
                    "url": program_url,
                    "requirements": {}
                }
                continue
            
            result["majors"][f"{major_name} {degree_type}"] = {
                "url": program_url,
                # Return the raw text content of the program page as requested
                "raw_text": program_soup.get_text(" ", strip=True),
                "error": None
            }
        
        # Process minors if provided
        if minors:
            for minor_name, degree_type in minors.items():
                logger.info(f"Processing minor: {minor_name} {degree_type}")
                # Similar processing for minors
                # For now, just add placeholder
                result["minors"][f"{minor_name} {degree_type}"] = {
                    "url": None,
                    "requirements": {},
                    "error": "Minor processing not yet implemented"
                }
        
        # Generate summary
        total_majors = len(majors)
        successful_majors = sum(1 for major_data in result["majors"].values() if not major_data.get("error"))
        
        summary = f"Retrieved information for {successful_majors}/{total_majors} majors"
        if minors:
            summary += f" and {len(minors)} minors"
        
        return (result, summary)
        
    except Exception as e:
        logger.error(f"Error in get_information: {str(e)}")
        return ({}, f"Error retrieving catalog information: {str(e)}")

def lambda_handler(event, context):
    """
    AWS Lambda handler for Bedrock Agent action group.
    
    Event structure from Bedrock:
    {
        "actionGroup": "catalog_browser",
        "function": "get_information",
        "parameters": [
            {"name": "majors", "type": "object", "value": {"Computer Science": "BS"}},
            {"name": "minors", "type": "object", "value": {}}
        ]
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
            param_name = param["name"]
            param_value = param["value"]
            
            # Parse JSON strings for majors and minors
            if param_name in ["majors", "minors"]:
                try:
                    if isinstance(param_value, str):
                        parameters[param_name] = json.loads(param_value)
                    else:
                        parameters[param_name] = param_value
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON for {param_name}: {str(e)}")
                    parameters[param_name] = {}
            else:
                parameters[param_name] = param_value
    
    print(f"Extracted parameters: {parameters}")
    
    # Route to appropriate function
    if function_name == "get_information":
        majors = parameters.get("majors", {})
        minors = parameters.get("minors", {})
        
        result, summary = get_information(majors, minors)
        
        # Return in the format Bedrock expects
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": action_group,
                "function": function_name,
                "functionResponse": {
                    "responseBody": {"TEXT": {"body": json.dumps({"result": result, "summary": summary})}}
                },
            },
        }
    else:
        # Return error in Bedrock format
        return {
            "messageVersion": "1.0",
            "response": {
                "actionGroup": action_group,
                "function": function_name,
                "functionResponse": {
                    "responseState": "FAILURE",
                    "responseBody": {"TEXT": {"body": json.dumps({"error": f"Unknown function: {function_name}"})}}
                },
            },
        }

if __name__ == "__main__":
    # For local testing
    test_majors = {"Computer Science": "BS"}
    test_minors = {}
    
    result, summary = get_information(test_majors, test_minors)
    print(f"Summary: {summary}")
    print(f"Result: {json.dumps(result, indent=2)}")
