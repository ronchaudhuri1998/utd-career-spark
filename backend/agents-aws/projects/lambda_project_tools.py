#!/usr/bin/env python3
"""
AWS Lambda function for Project tools with real API integrations
Handles project recommendations from GitHub, ArXiv, Hugging Face, and Kaggle
"""

import json
import os
import requests
import xml.etree.ElementTree as ET
from typing import List, Dict, Tuple, Optional

# Set Kaggle config directory to /tmp to avoid read-only filesystem issues in Lambda
os.environ["KAGGLE_CONFIG_DIR"] = "/tmp"

# Import Kaggle API
try:
    from kaggle.api.kaggle_api_extended import KaggleApi

    KAGGLE_AVAILABLE = True
except Exception as e:
    print(f"Warning: Kaggle API not available: {e}")
    KAGGLE_AVAILABLE = False


def search_github_projects(
    query: str, language: Optional[str] = None
) -> Tuple[List[Dict], str]:
    """
    Search GitHub repositories for project inspiration.
    Returns: (list of projects, summary)
    """
    try:
        # Build search query
        search_query = query
        if language:
            search_query += f" language:{language}"

        # GitHub API endpoint
        url = "https://api.github.com/search/repositories"
        params = {"q": search_query, "sort": "stars", "order": "desc", "per_page": 10}

        # Add authentication if available
        headers = {}
        github_token = os.getenv("GITHUB_TOKEN")
        if github_token:
            headers["Authorization"] = f"token {github_token}"

        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()

        data = response.json()
        projects = []

        for repo in data.get("items", []):
            project = {
                "title": repo["name"],
                "description": repo["description"] or "No description available",
                "url": repo["html_url"],
                "stars": repo["stargazers_count"],
                "language": repo["language"],
                "topics": repo.get("topics", []),
                "created_at": repo["created_at"],
                "updated_at": repo["updated_at"],
            }
            projects.append(project)

        return (projects, f"Found {len(projects)} GitHub repositories for '{query}'")

    except Exception as e:
        return ([], f"Error searching GitHub: {str(e)}")


def search_arxiv_papers(
    query: str, category: Optional[str] = None
) -> Tuple[List[Dict], str]:
    """
    Search ArXiv for research papers that could inspire projects.
    Returns: (list of papers, summary)
    """
    try:
        # Build search query
        search_query = f"all:{query}"
        if category:
            search_query += f" cat:{category}"

        # ArXiv API endpoint
        url = "http://export.arxiv.org/api/query"
        params = {
            "search_query": search_query,
            "start": 0,
            "max_results": 10,
            "sortBy": "relevance",
            "sortOrder": "descending",
        }

        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        # Parse XML response
        root = ET.fromstring(response.content)
        papers = []

        for entry in root.findall("{http://www.w3.org/2005/Atom}entry"):
            paper = {
                "title": entry.find("{http://www.w3.org/2005/Atom}title").text.strip(),
                "summary": entry.find(
                    "{http://www.w3.org/2005/Atom}summary"
                ).text.strip(),
                "authors": [
                    author.find("{http://www.w3.org/2005/Atom}name").text
                    for author in entry.findall("{http://www.w3.org/2005/Atom}author")
                ],
                "published": entry.find("{http://www.w3.org/2005/Atom}published").text,
                "updated": entry.find("{http://www.w3.org/2005/Atom}updated").text,
                "categories": [
                    cat.get("term")
                    for cat in entry.findall("{http://www.w3.org/2005/Atom}category")
                ],
                "url": entry.find("{http://www.w3.org/2005/Atom}id").text,
            }
            papers.append(paper)

        return (papers, f"Found {len(papers)} ArXiv papers for '{query}'")

    except Exception as e:
        return ([], f"Error searching ArXiv: {str(e)}")


def search_huggingface_models(
    task: Optional[str] = None, query: Optional[str] = None
) -> Tuple[List[Dict], str]:
    """
    Search Hugging Face for ML models and datasets.
    Returns: (list of models/datasets, summary)
    """
    try:
        # Search models
        models_url = "https://huggingface.co/api/models"
        models_params = {"limit": 10}

        if task:
            models_params["filter"] = f"task:{task}"
        if query:
            models_params["search"] = query

        response = requests.get(models_url, params=models_params, timeout=10)
        response.raise_for_status()

        models_data = response.json()
        results = []

        for model in models_data:
            result = {
                "name": model["modelId"],
                "type": "model",
                "pipeline_tag": model.get("pipeline_tag"),
                "downloads": model.get("downloads", 0),
                "tags": model.get("tags", []),
                "url": f"https://huggingface.co/{model['modelId']}",
            }
            results.append(result)

        # Search datasets
        datasets_url = "https://huggingface.co/api/datasets"
        datasets_params = {"limit": 5}

        if query:
            datasets_params["search"] = query

        response = requests.get(datasets_url, params=datasets_params, timeout=10)
        response.raise_for_status()

        datasets_data = response.json()

        for dataset in datasets_data:
            result = {
                "name": dataset["id"],
                "type": "dataset",
                "downloads": dataset.get("downloads", 0),
                "tags": dataset.get("tags", []),
                "url": f"https://huggingface.co/datasets/{dataset['id']}",
            }
            results.append(result)

        return (results, f"Found {len(results)} Hugging Face models/datasets")

    except Exception as e:
        return ([], f"Error searching Hugging Face: {str(e)}")


def search_kaggle_datasets(query: str) -> Tuple[List[Dict], str]:
    """
    Search Kaggle for datasets and competitions.
    Returns: (list of datasets/competitions, summary)
    """
    if not KAGGLE_AVAILABLE:
        return ([], "Kaggle API not available in this environment")

    try:
        # Initialize Kaggle API
        kaggle_api = KaggleApi()

        # Set credentials if available
        kaggle_username = os.getenv("KAGGLE_USERNAME")
        kaggle_key = os.getenv("KAGGLE_KEY")

        if kaggle_username and kaggle_key:
            kaggle_api.authenticate()

        results = []

        # Search datasets
        try:
            datasets = kaggle_api.dataset_list(search=query, max_size=10)
            for dataset in datasets:
                result = {
                    "name": str(dataset.title),
                    "type": "dataset",
                    "size": str(getattr(dataset, "totalBytes", "Unknown")),
                    "downloads": int(getattr(dataset, "downloadCount", 0)),
                    "url": f"https://www.kaggle.com/datasets/{dataset.ref}",
                    "tags": [str(tag) for tag in getattr(dataset, "tags", [])],
                }
                results.append(result)
        except Exception as e:
            print(f"Error fetching Kaggle datasets: {e}")

        # Search competitions
        try:
            competitions = kaggle_api.competitions_list(search=query)
            for competition in competitions:
                result = {
                    "name": str(competition.title),
                    "type": "competition",
                    "category": str(getattr(competition, "category", "Unknown")),
                    "reward": str(getattr(competition, "reward", "Unknown")),
                    "url": f"https://www.kaggle.com/c/{competition.ref}",
                    "deadline": str(getattr(competition, "deadline", "Unknown")),
                }
                results.append(result)
        except Exception as e:
            print(f"Error fetching Kaggle competitions: {e}")

        return (
            results,
            f"Found {len(results)} Kaggle datasets/competitions for '{query}'",
        )

    except Exception as e:
        return ([], f"Error searching Kaggle: {str(e)}")


def search_project_inspiration(
    query: str, sources: List[str] = None
) -> Tuple[List[Dict], str]:
    """
    Multi-tool search across multiple APIs for project inspiration.
    Returns: (aggregated results, summary)
    """
    if sources is None:
        sources = ["github", "arxiv", "huggingface", "kaggle"]

    all_results = []
    summaries = []

    try:
        # GitHub search
        if "github" in sources:
            github_results, github_summary = search_github_projects(query)
            all_results.extend([{**r, "source": "GitHub"} for r in github_results])
            summaries.append(github_summary)

        # ArXiv search
        if "arxiv" in sources:
            arxiv_results, arxiv_summary = search_arxiv_papers(query)
            all_results.extend([{**r, "source": "ArXiv"} for r in arxiv_results])
            summaries.append(arxiv_summary)

        # Hugging Face search
        if "huggingface" in sources:
            hf_results, hf_summary = search_huggingface_models(query=query)
            all_results.extend([{**r, "source": "Hugging Face"} for r in hf_results])
            summaries.append(hf_summary)

        # Kaggle search
        if "kaggle" in sources:
            kaggle_results, kaggle_summary = search_kaggle_datasets(query)
            all_results.extend([{**r, "source": "Kaggle"} for r in kaggle_results])
            summaries.append(kaggle_summary)

        combined_summary = f"Multi-source search: {'; '.join(summaries)}"
        return (all_results, combined_summary)

    except Exception as e:
        return ([], f"Error in multi-source search: {str(e)}")


def lambda_handler(event, context):
    """
    AWS Lambda handler for Bedrock Agent action group.

    Event structure from Bedrock:
    {
        "actionGroup": "project_tools",
        "function": "search_github_projects" | "search_arxiv_papers" | "search_huggingface_models" | "search_kaggle_datasets" | "search_project_inspiration",
        "parameters": {"query": "...", "language": "...", "category": "...", "task": "...", "sources": [...]}
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
    if function_name == "search_github_projects":
        query = parameters.get("query", "")
        language = parameters.get("language", None)
        projects, summary = search_github_projects(query, language)
        result = {"projects": projects, "summary": summary, "count": len(projects)}
    elif function_name == "search_arxiv_papers":
        query = parameters.get("query", "")
        category = parameters.get("category", None)
        papers, summary = search_arxiv_papers(query, category)
        result = {"papers": papers, "summary": summary, "count": len(papers)}
    elif function_name == "search_huggingface_models":
        task = parameters.get("task", None)
        query = parameters.get("query", None)
        models, summary = search_huggingface_models(task, query)
        result = {"models": models, "summary": summary, "count": len(models)}
    elif function_name == "search_kaggle_datasets":
        query = parameters.get("query", "")
        datasets, summary = search_kaggle_datasets(query)
        result = {"datasets": datasets, "summary": summary, "count": len(datasets)}
    elif function_name == "search_project_inspiration":
        query = parameters.get("query", "")
        sources_str = parameters.get("sources", "github,arxiv,huggingface,kaggle")
        # Convert comma-separated string to list
        sources = (
            [s.strip() for s in sources_str.split(",")]
            if sources_str
            else ["github", "arxiv", "huggingface", "kaggle"]
        )
        results, summary = search_project_inspiration(query, sources)
        result = {"results": results, "summary": summary, "count": len(results)}
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
