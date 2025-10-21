# AWS Bedrock AgentCore Implementation

This folder contains the complete AWS Bedrock AgentCore multi-agent implementation for UTD Career Spark.

## 📁 Files

| File                           | Purpose                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `AGENTCORE_ARCHITECTURE.md`    | **📖 Main Documentation** - System architecture, design decisions, deployment guide |
| `setup_agentcore_agents.py`    | Creates all 4 agents (deletes old ones, creates fresh with Lambda)                  |
| `deploy_lambda.py`             | Deploys Lambda function for web scraping tools                                      |
| `lambda_job_market_tools.py`   | Lambda source code (HackerNews, ITJobsWatch scrapers)                               |
| `lambda_requirements.txt`      | Lambda dependencies (requests, beautifulsoup4)                                      |
| `update_agents_with_lambda.py` | Updates existing agents to use Lambda (incremental)                                 |
| `test_agentcore_workflow.py`   | Tests complete multi-agent collaboration                                            |

## 🚀 Quick Start

### First Time Setup

```bash
cd agents-aws

# 1. Deploy Lambda function
python3 deploy_lambda.py

# 2. Add Lambda ARN to .env
# LAMBDA_JOB_MARKET_TOOLS_ARN=arn:aws:lambda:...

# 3. Create all agents
python3 setup_agentcore_agents.py

# 4. Update .env with agent IDs from output

# 5. Test
python3 test_agentcore_workflow.py
```

### Update Workflow

```bash
# If you change Lambda code:
python3 deploy_lambda.py

# If you change agent instructions:
python3 setup_agentcore_agents.py

# To test:
python3 test_agentcore_workflow.py
```

## 📋 Prerequisites

- AWS credentials configured
- Python 3.11+
- IAM permissions for Bedrock + Lambda
- AgentCoreMemoryRole with proper trust policy

See `AGENTCORE_ARCHITECTURE.md` for full setup details.

## 🏗️ Architecture

```
User → CareerPlanner (Supervisor)
        ├→ JobMarketAgent → Lambda Tools → Web Scraping
        ├→ CourseCatalogAgent
        └→ ProjectAdvisorAgent
```

## 📚 Documentation

**Read `AGENTCORE_ARCHITECTURE.md` for:**

- Complete system overview
- Architecture diagrams
- AWS resource details
- IAM permissions
- Design decisions
- Performance metrics
- Future enhancements

## 🎯 Current Status

✅ **DEPLOYED & WORKING**

- All 4 agents created
- Lambda functions deployed
- Multi-agent collaboration functional
- End-to-end test passed

## 💡 Key Features

- **Supervisor/Collaborator Pattern**: Automatic agent coordination
- **Lambda Tools**: AWS-native tool execution (no RETURN_CONTROL complexity)
- **Shared Memory**: Context maintained across all agents
- **Production Ready**: Clean agent recreation, proper IAM setup
