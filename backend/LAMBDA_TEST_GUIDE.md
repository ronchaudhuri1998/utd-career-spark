# Lambda Function Testing Guide

Complete guide for testing all AWS Lambda functions in the UTD Career Spark project.

## Overview

This project has **6 Lambda functions** deployed in AWS:

1. **UTD-JobMarketTools** - Web scraping tools for job market data
2. **UTD-NebulaAPITools** - UTD course data retrieval from Nebula API
3. **UTD-ProjectTools** - Project recommendations from GitHub, ArXiv, Hugging Face, Kaggle
4. **UTD-ValidateJobMarket** - Validates job market agent responses
5. **UTD-ValidateCourse** - Validates course catalog agent responses
6. **UTD-ValidateProject** - Validates project advisor agent responses

## Quick Start

### Test Locally

```bash
cd backend
python test_all_lambdas_local.py
```

### Test in AWS Console

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda)
2. Select a function (e.g., `UTD-NebulaAPITools`)
3. Click "Test" tab
4. Create new test event
5. Copy JSON payload from appropriate test file below
6. Click "Test"

## Test Payload Files

Each Lambda function has detailed test payloads in markdown format:

### 1. Job Market Tools

📄 **File**: `backend/agents-aws/job/LAMBDA_TEST_PAYLOADS.md`

Tests:

- `scrape_hackernews_jobs` - Scrape Hacker News job postings
- `scrape_itjobswatch_skills` - Fetch trending tech skills

### 2. Nebula API Tools

📄 **File**: `backend/agents-aws/nebula/LAMBDA_TEST_PAYLOADS.md`

Tests:

- `get_course_information` - Get basic course metadata
- `get_course_sections_trends` - Get historical section data
- `get_professor_information` - Get professor details
- `get_professor_sections_trends` - Get professor teaching history
- `get_grades_by_semester` - Get grade distributions
- `get_course_dashboard_data` - Get comprehensive course data
- `get_professor_dashboard_data` - Get comprehensive professor data

**Required**: Set `NEBULA_API_KEY` environment variable in Lambda configuration

### 3. Project Tools

📄 **File**: `backend/agents-aws/projects/LAMBDA_TEST_PAYLOADS.md`

Tests:

- `search_github_projects` - Search GitHub repositories
- `search_arxiv_papers` - Search ArXiv research papers
- `search_huggingface_models` - Search Hugging Face models/datasets
- `search_kaggle_datasets` - Search Kaggle datasets/competitions
- `search_project_inspiration` - Multi-source search

### 4. Validation Tools

📄 **File**: `backend/agents-aws/validation/LAMBDA_TEST_PAYLOADS.md`

Tests:

- `validate_course_format` - Validate course catalog format
- `validate_job_market_format` - Validate job market format
- `validate_project_format` - Validate project recommendations format

## Lambda ARNs

```
LAMBDA_JOB_MARKET_TOOLS_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-JobMarketTools
LAMBDA_NEBULA_API_TOOLS_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-NebulaAPITools
LAMBDA_PROJECT_TOOLS_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-ProjectTools
LAMBDA_VALIDATE_JOBMARKET_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-ValidateJobMarket
LAMBDA_VALIDATE_COURSE_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-ValidateCourse
LAMBDA_VALIDATE_PROJECT_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-ValidateProject
```

## Environment Variables

### Required for Nebula Lambda:

```bash
NEBULA_API_KEY=<your-api-key>
```

### Optional for other Lambdas:

```bash
GITHUB_TOKEN=<token>  # For higher GitHub API rate limits
KAGGLE_USERNAME=<username>
KAGGLE_KEY=<key>
```

## Testing Workflow

### Option 1: Test via AWS Console (Recommended for Cloud)

1. Navigate to AWS Lambda Console
2. Select function to test
3. Go to Test tab
4. Use payloads from the `.md` files above
5. View CloudWatch Logs for execution details

### Option 2: Test Locally

```bash
cd backend
python test_all_lambdas_local.py
```

This tests the Lambda code locally without invoking AWS.

### Option 3: Test via Bedrock Agent

1. Make a request through the application
2. Check CloudWatch Logs for the Lambda functions
3. Inspect traces in Bedrock Agent runtime

## Example: Testing Nebula API Tools

### Step 1: Get Test Payload

Open `backend/agents-aws/nebula/LAMBDA_TEST_PAYLOADS.md` and copy Test 1 payload

### Step 2: Configure Environment Variable

1. Go to Lambda Configuration → Environment Variables
2. Add: `NEBULA_API_KEY` with your API key

### Step 3: Test in AWS Console

1. Create test event
2. Paste the JSON payload
3. Run test
4. Check output

### Expected Output:

```json
{
  "messageVersion": "1.0",
  "response": {
    "actionGroup": "nebula_tools",
    "function": "get_course_information",
    "functionResponse": {
      "responseBody": {
        "TEXT": {
          "body": "{\"course_info\": {...}, \"summary\": \"Retrieved course information for CS 1336\"}"
        }
      }
    }
  }
}
```

## Troubleshooting

### Error: "NEBULA_API_KEY environment variable not set"

- Set the environment variable in Lambda configuration
- See Lambda Configuration → Environment Variables

### Error: "AccessDeniedException"

- Your IAM user doesn't have permission to invoke Lambda
- Lambda functions are invoked by Bedrock agents, not directly

### Error: "Timeout error"

- Check Lambda timeout settings (should be 60 seconds)
- Some functions make external HTTP requests and may be slow

### Error: "Module not found"

- Check Lambda deployment package includes all dependencies
- Verify `lambda_requirements.txt` is up to date

## CloudWatch Logs

View logs for each Lambda:

```bash
aws logs tail /aws/lambda/UTD-NebulaAPITools --follow
aws logs tail /aws/lambda/UTD-JobMarketTools --follow
aws logs tail /aws/lambda/UTD-ProjectTools --follow
```

## Test Summary Report

After testing all Lambda functions, see:
📄 **File**: `backend/LAMBDA_TEST_REPORT.md`

This contains the status and test results for all deployed Lambda functions.
