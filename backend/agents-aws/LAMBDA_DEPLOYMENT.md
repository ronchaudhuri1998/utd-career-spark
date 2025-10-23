# Lambda Functions Deployment Guide

This directory contains six separate Lambda functions for the UTD Career Spark application, each in its own folder:

## Structure

```
agents-aws/
├── job/                    # Job Market Tools
│   ├── lambda_job_market_tools.py
│   ├── lambda_requirements.txt
│   └── deploy_lambda.py
├── nebula/                 # Nebula API Tools (UTD course/professor data)
│   ├── lambda_nebula_tools.py
│   ├── lambda_requirements.txt
│   └── deploy_lambda.py
├── projects/               # Project Tools
│   ├── lambda_project_tools.py
│   ├── lambda_requirements.txt
│   └── deploy_lambda.py
├── validation/             # Format validation tools
│   ├── lambda_validate_job_market.py
│   ├── lambda_validate_course.py
│   ├── lambda_validate_project.py
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

### 2. Nebula API Tools (`nebula/`)
- **Function Name**: `UTD-NebulaAPITools`
- **Purpose**: UTD course catalog and professor data via Nebula API
- **Functions**:
  - `get_course_sections_trends()` - Historical section data with grade distributions
  - `get_professor_sections_trends()` - Professor teaching history with grades
  - `get_grades_by_semester()` - Grade distribution by semester
  - `get_course_information()` - Course metadata and prerequisites
  - `get_professor_information()` - Professor details and titles
  - `get_course_dashboard_data()` - Comprehensive course dashboard
  - `get_professor_dashboard_data()` - Comprehensive professor dashboard

### 3. Project Tools (`projects/`)
- **Function Name**: `UTD-ProjectTools`
- **Purpose**: Project recommendations and portfolio analysis
- **Functions**:
  - `search_github_projects()` - Search GitHub repositories for inspiration
  - `search_arxiv_papers()` - Search ArXiv for research papers
  - `search_huggingface_models()` - Search Hugging Face for ML models
  - `search_kaggle_datasets()` - Search Kaggle for datasets and competitions
  - `search_project_inspiration()` - Multi-source project search

### 4. Validation Tools (`validation/`)
- **Function Names**: `UTD-ValidateJobMarket`, `UTD-ValidateCourse`, `UTD-ValidateProject`
- **Purpose**: Format validation for agent outputs
- **Functions**:
  - `validate_job_market_format()` - Validates job market agent output format
  - `validate_course_format()` - Validates course catalog agent output format
  - `validate_project_format()` - Validates project advisor agent output format

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

# Deploy nebula API tools
cd ../nebula
python deploy_lambda.py

# Deploy project tools
cd ../projects
python deploy_lambda.py

# Deploy validation tools
cd ../validation
python deploy_lambda.py
```

## Environment Variables

Make sure you have the following in your `.env` file:

```bash
AWS_REGION=us-east-1
LAMBDA_EXECUTION_ROLE_ARN=arn:aws:iam::ACCOUNT:role/ROLE_NAME
# OR reuse AgentCore role:
AGENTCORE_EXECUTION_ROLE_ARN=arn:aws:iam::ACCOUNT:role/ROLE_NAME

# API Keys (Required for external services)
NEBULA_API_KEY=your_nebula_api_key
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_KEY=your_kaggle_key
```

**Note:** The Nebula API is run by a student organization @ UTD and not intended for public use. Please contact davis.mo@utdallas.edu if you want a key for this.

## After Deployment

After successful deployment, you'll get Lambda ARNs like:
- `LAMBDA_JOB_MARKET_TOOLS_ARN=arn:aws:lambda:...`
- `LAMBDA_NEBULA_API_TOOLS_ARN=arn:aws:lambda:...`
- `LAMBDA_PROJECT_TOOLS_ARN=arn:aws:lambda:...`
- `LAMBDA_VALIDATE_JOBMARKET_ARN=arn:aws:lambda:...`
- `LAMBDA_VALIDATE_COURSE_ARN=arn:aws:lambda:...`
- `LAMBDA_VALIDATE_PROJECT_ARN=arn:aws:lambda:...`

Add these to your `.env` file and update `setup_agentcore_agents.py` to use the new Lambda ARNs.

## Troubleshooting

1. **Permission Issues**: Make sure your AWS credentials have Lambda and IAM permissions
2. **Role Issues**: Ensure the execution role has the necessary permissions for Bedrock
3. **Timeout Issues**: Adjust timeout and memory settings in the deployment scripts if needed
4. **Dependencies**: Each function has its own requirements.txt with minimal dependencies

## Testing

After deployment, test each Lambda function through the Bedrock Agent interface or directly through the AWS Lambda console.
