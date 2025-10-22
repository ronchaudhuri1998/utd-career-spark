# Lambda Functions Deployment Guide

This directory contains three separate Lambda functions for the UTD Career Spark application, each in its own folder:

## Structure

```
agents-aws/
├── job/                    # Job Market Tools
│   ├── lambda_job_market_tools.py
│   ├── lambda_requirements.txt
│   └── deploy_lambda.py
├── course/                 # Course Catalog Tools
│   ├── lambda_course_tools.py
│   ├── lambda_requirements.txt
│   └── deploy_lambda.py
├── projects/               # Project Tools
│   ├── lambda_project_tools.py
│   ├── lambda_requirements.txt
│   └── deploy_lambda.py
└── deploy_all_lambdas.py   # Master deployment script
```

## Lambda Functions

### 1. Job Market Tools (`job/`)
- **Function Name**: `UTD-JobMarketTools`
- **Purpose**: Web scraping for job market data
- **Functions**:
  - `scrape_hackernews_jobs()` - Scrapes Hacker News job postings
  - `scrape_itjobswatch_skills()` - Gets trending tech skills from IT Jobs Watch

### 2. Course Catalog Tools (`course/`)
- **Function Name**: `UTD-CourseCatalogTools`
- **Purpose**: Course data retrieval and analysis
- **Functions**:
  - `get_course_catalog()` - Retrieves full course catalog
  - `search_courses_by_keyword()` - Search courses by keyword
  - `get_course_prerequisites()` - Get prerequisites for a course
  - `get_courses_by_department()` - Get courses by department

### 3. Project Tools (`projects/`)
- **Function Name**: `UTD-ProjectTools`
- **Purpose**: Project recommendations and portfolio analysis
- **Functions**:
  - `get_project_recommendations()` - Get project recommendations based on skills
  - `get_project_by_category()` - Get projects by category
  - `analyze_project_complexity()` - Analyze project complexity
  - `get_project_roadmap()` - Get project roadmap based on career goals

## Deployment Options

### Option 1: Deploy All Functions (Recommended)
```bash
cd agents-aws
python deploy_all_lambdas.py
```

### Option 2: Deploy Individual Functions
```bash
# Deploy job market tools
cd job
python deploy_lambda.py

# Deploy course catalog tools
cd ../course
python deploy_lambda.py

# Deploy project tools
cd ../projects
python deploy_lambda.py
```

## Environment Variables

Make sure you have the following in your `.env` file:

```bash
AWS_REGION=us-east-1
LAMBDA_EXECUTION_ROLE_ARN=arn:aws:iam::ACCOUNT:role/ROLE_NAME
# OR reuse AgentCore role:
AGENTCORE_EXECUTION_ROLE_ARN=arn:aws:iam::ACCOUNT:role/ROLE_NAME
```

## After Deployment

After successful deployment, you'll get Lambda ARNs like:
- `LAMBDA_JOB_MARKET_TOOLS_ARN=arn:aws:lambda:...`
- `LAMBDA_COURSE_CATALOG_TOOLS_ARN=arn:aws:lambda:...`
- `LAMBDA_PROJECT_TOOLS_ARN=arn:aws:lambda:...`

Add these to your `.env` file and update `setup_agentcore_agents.py` to use the new Lambda ARNs.

## Troubleshooting

1. **Permission Issues**: Make sure your AWS credentials have Lambda and IAM permissions
2. **Role Issues**: Ensure the execution role has the necessary permissions for Bedrock
3. **Timeout Issues**: Adjust timeout and memory settings in the deployment scripts if needed
4. **Dependencies**: Each function has its own requirements.txt with minimal dependencies

## Testing

After deployment, test each Lambda function through the Bedrock Agent interface or directly through the AWS Lambda console.
