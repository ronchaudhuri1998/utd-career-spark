#!/usr/bin/env python3
"""
AWS Lambda function for Job Market tools
Handles web scraping for Hacker News jobs and IT Jobs Watch skills
"""

import json
import re
from typing import List, Tuple


def scrape_hackernews_jobs() -> Tuple[List[str], str]:
    """
    Scrapes current job postings from Hacker News Who is Hiring thread.
    Returns: (list of job roles, summary)
    """
    try:
        import requests
        from bs4 import BeautifulSoup

        # Find the latest "Who is Hiring?" thread
        url = "https://news.ycombinator.com/submitted?id=whoishiring"
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")

        # Get the first "Who is Hiring?" post
        hiring_link = None
        for link in soup.find_all("a", class_="storylink"):
            if "Who is hiring?" in link.text:
                hiring_link = link.get("href")
                break

        if not hiring_link:
            return ([], "Could not find current hiring thread")

        # Scrape the hiring thread
        thread_url = f"https://news.ycombinator.com/{hiring_link}"
        thread_response = requests.get(thread_url, timeout=10)
        thread_soup = BeautifulSoup(thread_response.text, "html.parser")

        roles = []
        comments = thread_soup.find_all("div", class_="comment")

        for comment in comments[:30]:  # Limit to first 30 postings
            text = comment.get_text()
            # Extract role/title (usually after company name, often in format "Role | Company")
            if "|" in text:
                parts = text.split("|")
                if len(parts) >= 2:
                    role = parts[0].strip()
                    roles.append(role[:100])  # Limit length

        return (roles[:30], f"Found {len(roles)} job postings")

    except Exception as e:
        return ([], f"Error scraping Hacker News: {str(e)}")


def scrape_itjobswatch_skills() -> Tuple[List[str], str]:
    """
    Fetches trending tech skills and salary data from IT Jobs Watch.
    Returns: (list of skills with salary info, summary)
    """
    try:
        import requests
        from bs4 import BeautifulSoup

        url = "https://www.itjobswatch.co.uk/default.aspx?page=1&sortby=0&orderby=0&q=&id=0&lid=2618"
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")

        skills = []
        # Find the skills table
        table = soup.find("table", class_="table")
        if table:
            rows = table.find_all("tr")[1:]  # Skip header
            for row in rows[:20]:  # Limit to top 20
                cols = row.find_all("td")
                if len(cols) >= 3:
                    skill_name = cols[0].get_text(strip=True)
                    median_salary = cols[2].get_text(strip=True)
                    skills.append(f"{skill_name}: {median_salary}")

        return (skills[:20], f"Found {len(skills)} trending skills")

    except Exception as e:
        return ([], f"Error scraping IT Jobs Watch: {str(e)}")


def lambda_handler(event, context):
    """
    AWS Lambda handler for Bedrock Agent action group.

    Event structure from Bedrock:
    {
        "actionGroup": "job_market_tools",
        "function": "scrape_hackernews_jobs" or "scrape_itjobswatch_skills",
        "parameters": []
    }
    """
    print(f"Received event: {json.dumps(event)}")

    # Extract action group and function from event
    action_group = event.get("actionGroup", "")
    function_name = event.get("function", "")

    # Execute the appropriate function
    if function_name == "scrape_hackernews_jobs":
        roles, summary = scrape_hackernews_jobs()
        result = {"roles": roles, "summary": summary, "count": len(roles)}
    elif function_name == "scrape_itjobswatch_skills":
        skills, summary = scrape_itjobswatch_skills()
        result = {"skills": skills, "summary": summary, "count": len(skills)}
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
