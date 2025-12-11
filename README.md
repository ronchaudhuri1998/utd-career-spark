# UTD Career Spark 🚀

**AI-Powered Career Guidance Platform using AWS Bedrock AgentCore Multi-Agent Architecture**

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-Python-green) ![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock-orange) ![Claude 3](https://img.shields.io/badge/Claude-3-purple)

---

## 🎯 Problem Statement

**Challenge:** UTD students struggle to align academic courses with real-world job market demands and build portfolios that showcase relevant skills.

**Solution:** Multi-agent AI system that analyzes live job market data, recommends relevant UTD courses, and suggests portfolio projects - all coordinated through AWS Bedrock AgentCore's supervisor/collaborator pattern.

**Why AI Agents?** Single LLMs lack specialized knowledge and real-time data. Our 4-agent architecture enables parallel research, specialized expertise, and AWS-native tool execution with Lambda functions.

---

## 🐳 Quick Docker Setup (For Judges)

**One-command setup for evaluation:**

```bash
# 1. Clone the repository
git clone <repository-url>
cd utd-career-spark

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your AWS credentials

# 3. Run with Docker Compose
docker-compose up --build

# 4. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

**Prerequisites:**
- Docker and Docker Compose installed
- AWS credentials (Access Key ID, Secret Key)
- AWS Bedrock access in us-east-1 region

**Environment Variables Required:**
```env
# AWS Credentials (Required)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# AgentCore Configuration (Required)
USE_AGENTCORE=1
AGENTCORE_EXECUTION_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT:role/AgentCoreMemoryRole
AGENTCORE_MEMORY_ID=your_memory_id

# Agent IDs (Required)
AGENTCORE_PLANNER_AGENT_ID=your_planner_agent_id
AGENTCORE_PLANNER_ALIAS_ID=your_planner_alias_id
# ... (see .env.example for full list)

# Lambda ARNs (Required)
LAMBDA_JOB_MARKET_TOOLS_ARN=arn:aws:lambda:us-east-1:YOUR_ACCOUNT:function:UTD-JobMarketTools
# ... (see .env.example for full list)

# API Keys (Required)
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_KEY=your_kaggle_key
NEBULA_API_KEY=your_nebula_api_key
```

**Note:** The application requires AWS Bedrock AgentCore setup. For evaluation purposes, you can use the pre-configured environment or set up your own AWS resources following the deployment guide below.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Frontend: React + TypeScript + shadcn/ui       │
│  • Real-time SSE streaming                      │
│  • User profile & onboarding                    │
└──────────────────┬──────────────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────────────┐
│  Backend: FastAPI + Python                      │
│  • Session management                           │
│  • AgentCore orchestration                      │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│  AWS Bedrock AgentCore Multi-Agent System       │
├─────────────────────────────────────────────────┤
│  CareerPlanner (Supervisor)                     │
│  ├─► JobMarketAgent → Lambda: Web Scraping      │
│  ├─► CourseCatalogAgent → UTD Course Data       │
│  └─► ProjectAdvisorAgent → Portfolio Ideas      │
└─────────────────────────────────────────────────┘
```

**📖 [Detailed Architecture Documentation](backend/agents-aws/AGENTCORE_ARCHITECTURE.md)**

---

## ✨ Key Features

- **Multi-Agent Collaboration**: Supervisor coordinates 3 specialist agents automatically
- **Custom Lambda Functions**: 6 specialized Lambda functions for real-time data collection
  - **Job Market Tools**: Live scraping from HackerNews & IT Jobs Watch
  - **Nebula API Tools**: UTD course catalog with professor data & grade distributions
  - **Project Tools**: GitHub, ArXiv, Hugging Face, and Kaggle integration
  - **Validation Tools**: Format validation for job market, course, and project outputs
  - **Claude Integration**: Direct AI calls for goal classification and intro messages
- **Live Data Integration**: Real-time job postings, course information, and project inspiration
- **Personalized Recommendations**: UTD-specific course suggestions with professor insights
- **Portfolio Development**: Tech stack recommendations based on current market demand
- **Shared Memory**: Context maintained across all agents for coherent conversations

---

## 🚀 Quick Start

### Local Development

**Access:** Frontend at `http://localhost:5173`, Backend at `http://localhost:8000`

### Environment Keys

Create a `.env` file in the backend directory with these keys:

**For Local Development (calls our AWS):**
```env
# Core AgentCore Configuration (REQUIRED)
USE_AGENTCORE=1
AGENTCORE_EXECUTION_ROLE_ARN=arn:aws:iam::556316456032:role/AgentCoreMemoryRole
AGENTCORE_MEMORY_ID=CareerAdvisorMemory-fN37Om3xKY

# Supervisor Agent (REQUIRED - the main agent that coordinates everything)
AGENTCORE_PLANNER_AGENT_ID=VEGZEB5SHM
AGENTCORE_PLANNER_ALIAS_ID=KVBBNAXDPS

# AWS Region (optional - defaults to us-east-1)
AWS_REGION=us-east-1
```

**Note:** All AI functionality (direct Claude calls, goal classification, intro messages, general chat) is deployed to Lambda functions. The supervisor agent automatically calls the deployed Lambda functions in the background.

**For Full AWS Deployment (deploy your own):**
```env
# AWS Credentials (REQUIRED for deployment)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# AgentCore Configuration
USE_AGENTCORE=1
AGENTCORE_EXECUTION_ROLE_ARN=your_execution_role_arn
AGENTCORE_MEMORY_ID=your_memory_id

# All Agent IDs (generated by setup_agentcore_agents.py)
AGENTCORE_JOB_AGENT_ID=...
AGENTCORE_JOB_ALIAS_ID=...
AGENTCORE_COURSE_AGENT_ID=...
AGENTCORE_COURSE_ALIAS_ID=...
AGENTCORE_PROJECT_AGENT_ID=...
AGENTCORE_PROJECT_ALIAS_ID=...
AGENTCORE_PLANNER_AGENT_ID=...
AGENTCORE_PLANNER_ALIAS_ID=...

# Lambda ARNs (generated by deploy_lambda.py scripts)
LAMBDA_JOB_MARKET_TOOLS_ARN=...
LAMBDA_PROJECT_TOOLS_ARN=...
LAMBDA_NEBULA_API_TOOLS_ARN=...
LAMBDA_VALIDATE_JOBMARKET_ARN=...
LAMBDA_VALIDATE_COURSE_ARN=...
LAMBDA_VALIDATE_PROJECT_ARN=...

# API Keys (needed for Lambda functions)
KAGGLE_USERNAME=your_username
KAGGLE_KEY=your_key
NEBULA_API_KEY=your_api_key
```
Note that the Nebula API is ran by a student organization @ UTD and not intended for public use. Please contact ron.chaudhuri@utdallas.edu if you want a key for this.

### Setup Commands

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**For Full AWS Deployment:**

```bash
cd backend/agents-aws

# 1. Deploy Lambda functions
python deploy_all_lambdas.py

# 1.5 Update .env with lambda ARNs from output

# 2. Create all agents
python setup_agentcore_agents.py

# 3. Update .env with agent IDs from output

# 4. Test
python test_agentcore_workflow.py
```

**For Local Docker Testing:**

```bash
# Build and test containers locally
./build-docker.sh
./test-docker-local.sh

# Or run full application with docker-compose
docker-compose up --build
```

**For AWS App Runner Deployment (Production):**

```bash
# One-command deployment to AWS App Runner
./deploy-apprunner.sh
```

**Prerequisites:** AWS credentials, Python 3.11+, IAM permissions for Bedrock + Lambda

---

## 🚀 Deployment Options

| Option | Use Case | Complexity | Cost | Auto-scaling |
|--------|----------|------------|------|--------------|
| **Local Development** | Development & testing | Low | Free | No |
| **AWS Lambda + AgentCore** | Serverless production | Medium | Pay-per-use | Yes |
| **AWS App Runner** | Containerized production | Medium | Fixed monthly | Yes |
| **AWS Amplify** | Static frontend hosting | Low | $1-5/month | Yes |

**Choose your deployment:**
- **Quick Start**: Local development for testing
- **Serverless**: AWS Lambda + AgentCore for serverless architecture
- **Production**: AWS App Runner for containerized deployment with auto-scaling
- **Cost-Effective**: AWS Amplify for static frontend hosting (~$1-5/month)

---

## 💻 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Backend** | FastAPI, Python 3.11, Uvicorn, SSE Streaming |
| **AI/ML** | AWS Bedrock, Claude 4.5 Sonnet (Latest), AgentCore Multi-Agent |
| **Cloud** | AWS Lambda (Python 3.11), IAM, Bedrock Runtime |
| **Tools** | BeautifulSoup4, Requests (web scraping) |
| **Dev Tools** | Git, npm, pip, boto3 |

---

## 📁 Project Structure

```
utd-career-spark/
├── frontend/              # React TypeScript app
│   ├── src/
│   │   ├── components/   # UI components (shadcn/ui)
│   │   ├── pages/        # Route pages
│   │   ├── contexts/     # React Context (user data, SSE)
│   │   └── lib/          # API client & utilities
│   └── README.md         # Frontend setup guide
├── backend/              # FastAPI server + AgentCore
│   ├── agents-aws/       # Multi-agent system
│   │   ├── job/          # Job market Lambda
│   │   ├── nebula/       # Nebula API Lambda
│   │   ├── projects/     # Project tools Lambda
│   │   ├── prompts/      # Agent instructions
│   │   └── README.md     # Agent deployment guide
│   ├── main.py           # FastAPI app
│   └── README.md         # Backend setup guide
└── docs/                 # Hackathon documentation
```

---

## ☁️ AWS Resources

### Deployed Agents
- **CareerPlanner** (Supervisor): `T3TCF2QM9X`
- **JobMarketAgent**: `61BLYEUNNP`
- **CourseCatalogAgent**: `2GB15BFRJI`
- **ProjectAdvisorAgent**: `5GGPMCAQSA`

### Lambda Functions
- `UTD-JobMarketTools` (Python 3.11, 512MB, 60s timeout)
- `UTD-NebulaAPITools` (Python 3.11, 512MB, 60s timeout)
- `UTD-ProjectTools` (Python 3.11, 512MB, 60s timeout)

### Configuration
- **Region**: `us-east-1`
- **Model**: Claude 3 Haiku
- **Memory**: 90-day session storage
- **Est. Cost**: ~$2-5 per 1000 requests

---

## 🏆 Built for AWS Bedrock AgentCore Hackathon 2025

**Team:** UTD Career Spark  
**Challenge:** Student Career Guidance & Portfolio Development  
**Innovation:** Multi-agent architecture with Lambda-based real-time data collection

---

## 📚 Documentation

- **Backend Setup**: [backend/README.md](backend/README.md)
- **Frontend Setup**: [frontend/README.md](frontend/README.md)
- **AgentCore Architecture**: [backend/agents-aws/AGENTCORE_ARCHITECTURE.md](backend/agents-aws/AGENTCORE_ARCHITECTURE.md)
- **Lambda Deployment**: [backend/agents-aws/LAMBDA_DEPLOYMENT.md](backend/agents-aws/LAMBDA_DEPLOYMENT.md)
- **AWS App Runner Deployment**: [AWS_APP_RUNNER_DEPLOYMENT.md](AWS_APP_RUNNER_DEPLOYMENT.md)
- **AWS Amplify Deployment**: [AWS_AMPLIFY_DEPLOYMENT.md](AWS_AMPLIFY_DEPLOYMENT.md)
- **Local Docker Testing**: [LOCAL_DOCKER_TESTING.md](LOCAL_DOCKER_TESTING.md)

---

## 🚀 UTD Career Spark – UI Preview

### 🏠 Landing Page  
The main student dashboard showing the multi-agent career guidance ecosystem.  
<img src="HomePage1.jpg" width="900"/>

---

### 🤖 Multi-Agent Orchestration  
Real-time orchestration between Supervisor, Job Market Agent, Academic Advisor, and Project Advisor.  
<img src="Multi-agent Orchestration.png" width="900"/>

---
### 🎓 Academic Advisor Agent  
Assists students with course planning and academic decisions.  
<img src="Academic_Advisor.png" width="900"/>

---

### 💼 Job Market Assistant  
Analyzes job postings and skill trends to provide personalized guidance.  
<img src="Job_Market_Assistant.png" width="900"/>

---

### 🤖 Portfolio & Project Recommendations  
Suggests personalized project ideas to improve student portfolios.  
<img src="Portfolio_Project.png" width="900"/>


## 📝 License

MIT License - Built for educational purposes as part of AWS Bedrock AgentCore Hackathon 2025.

deploying to apprunner guide:
1. brew install awscli
export AWS_ACCESS_KEY_ID=AKIAYDBYLORQM5NJVLUL && export AWS_SECRET_ACCESS_KEY=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 && export AWS_REGION=us-east-1 && ./recreate-services.sh
