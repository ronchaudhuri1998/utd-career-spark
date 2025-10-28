# UTD Career Spark - AgentCore Multi-Agent Architecture

## System Overview

A production-ready AWS Bedrock AgentCore multi-agent system for career guidance, featuring:

- 4 specialized AI agents with supervisor/collaborator pattern
- Lambda-based web scraping tools
- Shared session memory
- Automatic agent orchestration by AWS Bedrock

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User Request                        │
│              "I want to become a data scientist"            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│            CareerPlannerAgent (SUPERVISOR)                  │
│  - Coordinates all specialist agents                        │
│  - Synthesizes responses                                    │
│  - Maintains session context                                │
└──────────┬──────────────────┬──────────────────┬────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌───────────────────┐
│ JobMarketAgent   │ │CourseCatalogAgent│ │ProjectAdvisorAgent│
│                  │ │                  │ │                   │
│ Tools:           │ │ Tools:           │ │ Tools:            │
│ ├─Lambda: HN Jobs│ │ ├─Lambda: Courses│ │ ├─Lambda: GitHub  │
│ └─Lambda: Skills │ │ ├─Lambda: Profs  │ │ ├─Lambda: ArXiv   │
└──────────┬───────┘ └──────────┬───────┘ └──────────┬────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌───────────────────┐
│ UTD_JobMarketTools│ │ UTD_NebulaAPITools│ │ UTD_ProjectTools │
│                  │ │                  │ │                   │
│ Functions:       │ │ Functions:       │ │ Functions:        │
│ ├─scrape_hackernews_jobs()│ ├─get_course_sections_trends()│ ├─search_github_projects()│
│ └─scrape_itjobswatch_skills()│ ├─get_professor_sections_trends()│ ├─search_arxiv_papers()│
│                  │ │ ├─get_course_information()│ ├─search_huggingface_models()│
│                  │ │ └─get_professor_information()│ ├─search_kaggle_datasets()│
└──────────┬───────┘ └──────────┬───────┘ └──────────┬────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌───────────────────┐
│ External Sources │ │ External Sources │ │ External Sources  │
│                  │ │                  │ │                   │
│ ├─Hacker News    │ │ ├─UTD Nebula API │ │ ├─GitHub API      │
│ └─IT Jobs Watch  │ │ └─UTD Course DB  │ │ ├─ArXiv API       │
│                  │ │                  │ │ ├─Hugging Face    │
│                  │ │                  │ │ └─Kaggle API      │
└──────────────────┘ └──────────────────┘ └───────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Validation Layer                               │
│                                                             │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│ │UTD_ValidateJobMarket│ │UTD_ValidateCourse│ │UTD_ValidateProject││
│ │                 │ │                 │ │                 ││
│ │Functions:       │ │Functions:       │ │Functions:       ││
│ │├─validate_job_market_format()│ │├─validate_course_format()│ │├─validate_project_format()││
│ │└─Format validation│ │└─Format validation│ │└─Format validation││
│ └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Definitions

### 1. CareerPlannerAgent (Supervisor)

- **Role**: Orchestrator and synthesizer
- **Type**: `SUPERVISOR`
- **Model**: Claude 3 Haiku
- **Responsibilities**:
  - Receive user career goals
  - Delegate to specialist agents
  - Synthesize comprehensive career plans
  - Maintain conversation context

### 2. JobMarketAgent (Collaborator)

- **Role**: Market intelligence specialist
- **Type**: `COLLABORATOR`
- **Model**: Claude 3 Haiku
- **Tools**:
  - `scrape_hackernews_jobs` (Lambda)
  - `scrape_itjobswatch_skills` (Lambda)
- **Responsibilities**:
  - Analyze hiring trends
  - Identify in-demand skills
  - Provide salary insights
  - Report emerging roles

### 3. CourseCatalogAgent (Collaborator)

- **Role**: Academic advisor
- **Type**: `COLLABORATOR`
- **Model**: Claude 3 Haiku
- **Tools**:
  - `get_course_sections_trends` (Lambda)
  - `get_professor_sections_trends` (Lambda)
  - `get_course_information` (Lambda)
  - `get_professor_information` (Lambda)
- **Responsibilities**:
  - Recommend UTD courses with grade distributions
  - Suggest professors based on teaching history
  - Align academics with job market
  - Provide campus resources and course prerequisites

### 4. ProjectAdvisorAgent (Collaborator)

- **Role**: Portfolio strategist
- **Type**: `COLLABORATOR`
- **Model**: Claude 3 Haiku
- **Tools**:
  - `search_github_projects` (Lambda)
  - `search_arxiv_papers` (Lambda)
  - `search_huggingface_models` (Lambda)
  - `search_kaggle_datasets` (Lambda)
  - `search_project_inspiration` (Lambda)
- **Responsibilities**:
  - Suggest portfolio projects from GitHub, ArXiv, Hugging Face, Kaggle
  - Recommend tech stacks based on current trends
  - Guide hands-on learning with real-world projects
  - Align projects with job requirements

---

## Key Components

### Lambda Functions

#### 1. Job Market Tools (`UTD_JobMarketTools`)
```python
# Runtime: Python 3.11, Timeout: 60s, Memory: 512MB
# Functions: scrape_hackernews_jobs(), scrape_itjobswatch_skills()
# Data Sources: Hacker News, IT Jobs Watch
```

#### 2. Nebula API Tools (`UTD_NebulaAPITools`)
```python
# Runtime: Python 3.11, Timeout: 30s, Memory: 256MB
# Functions: get_course_sections_trends(), get_professor_sections_trends(), etc.
# Data Sources: UTD Nebula API (courses, professors, grades)
```

#### 3. Project Tools (`UTD_ProjectTools`)
```python
# Runtime: Python 3.11, Timeout: 60s, Memory: 512MB
# Functions: search_github_projects(), search_arxiv_papers(), etc.
# Data Sources: GitHub, ArXiv, Hugging Face, Kaggle
```

#### 4. Validation Tools (`UTD_ValidateJobMarket`, `UTD_ValidateCourse`, `UTD_ValidateProject`)
```python
# Runtime: Python 3.11, Timeout: 30s, Memory: 256MB
# Functions: validate_job_market_format(), validate_course_format(), validate_project_format()
# Purpose: Format validation for agent outputs
```

### Memory Configuration

```python
{
    'enabledMemoryTypes': ['SESSION_SUMMARY'],
    'storageDays': 90,
}
```

- All agents share memory via `sessionId`
- Conversation history relayed to collaborators
- Context maintained across agent calls

### Collaboration Configuration

```python
control_client.associate_agent_collaborator(
    agentId=supervisor_id,
    agentVersion='DRAFT',
    agentDescriptor={'aliasArn': collaborator_alias_arn},
    collaboratorName='JobMarketAgent',
    collaborationInstruction='...',
    relayConversationHistory='TO_COLLABORATOR'
)
```

---

## Data Flow

### User Request Flow

1. **User** → "I want to become a data scientist"
2. **CareerPlanner** receives request
3. **CareerPlanner** → delegates to **JobMarketAgent**
   - "Analyze data science job market"
4. **JobMarketAgent** → invokes Lambda tools
   - Bedrock automatically calls Lambda
   - No manual RETURN_CONTROL handling
5. **Lambda** → scrapes HN Jobs & IT Jobs Watch
6. **Lambda** → returns structured data
7. **JobMarketAgent** → analyzes data, returns insights
8. **CareerPlanner** → delegates to **CourseCatalogAgent**
   - "Recommend relevant UTD courses"
9. **CourseCatalogAgent** → returns course recommendations
10. **CareerPlanner** → delegates to **ProjectAdvisorAgent**
    - "Suggest portfolio projects"
11. **ProjectAdvisorAgent** → returns project ideas
12. **CareerPlanner** → synthesizes all responses
13. **User** ← receives comprehensive career plan

---

## AWS Resources

### Bedrock Agents

| Agent          | ID         | Alias ID   |
| -------------- | ---------- | ---------- |
| CareerPlanner  | VEGZEB5SHM | KVBBNAXDPS |
| JobMarket      | CTFYALQVJP | F2FO2J3U3E |
| CourseCatalog  | 6AQGP6TGXL | HGMKLX9RRC |
| ProjectAdvisor | 3RE8BXKK3G | IBQ1Y3VKAE |

### Lambda Functions

| Function Name | ARN | Runtime | Purpose |
| ------------- | --- | ------- | ------- |
| UTD_JobMarketTools | `arn:aws:lambda:us-east-1:556316456032:function:UTD_JobMarketTools` | Python 3.11 | Web scraping (HN, IT Jobs Watch) |
| UTD_NebulaAPITools | `arn:aws:lambda:us-east-1:556316456032:function:UTD_NebulaAPITools` | Python 3.11 | UTD course/professor data |
| UTD_ProjectTools | `arn:aws:lambda:us-east-1:556316456032:function:UTD_ProjectTools` | Python 3.11 | Project recommendations (GitHub, ArXiv, etc.) |
| UTD_ValidateJobMarket | `arn:aws:lambda:us-east-1:556316456032:function:UTD_ValidateJobMarket` | Python 3.11 | Job market format validation |
| UTD_ValidateCourse | `arn:aws:lambda:us-east-1:556316456032:function:UTD_ValidateCourse` | Python 3.11 | Course format validation |
| UTD_ValidateProject | `arn:aws:lambda:us-east-1:556316456032:function:UTD_ValidateProject` | Python 3.11 | Project format validation |

### IAM Role

- **Name**: AgentCoreMemoryRole
- **Trusted Services**: bedrock.amazonaws.com, lambda.amazonaws.com
- **Permissions**:
  - `bedrock:InvokeModel` (for Claude)
  - `bedrock:InvokeAgent` (for collaboration)
  - `bedrock:GetAgentAlias` (for collaboration)
  - Lambda basic execution

---

## Key Design Decisions

### Why Lambda Instead of RETURN_CONTROL?

**Problem**: RETURN_CONTROL requires manual tool result routing. In multi-agent scenarios:

```
Supervisor → Collaborator → Tool Request → ???
          ← Where to return results? ←
```

**Solution**: Lambda functions

- Bedrock invokes Lambda automatically
- No manual routing needed
- Clean separation of concerns
- Production-ready pattern

### Why Supervisor/Collaborator Pattern?

**Benefits**:

- Clear separation of responsibilities
- Parallel agent development
- Easy to add new specialists
- Bedrock handles orchestration
- Natural conversation flow

### Why Shared Memory?

**Benefits**:

- Context preserved across agents
- No redundant questions
- Coherent conversation
- Better user experience

---

## Deployment

### Prerequisites

```bash
# AWS Credentials configured
# Python 3.11+
# Boto3 installed
```

### One-Command Deployment

```bash
cd backend

# Deploy Lambda
python3 deploy_lambda.py

# Create all agents
python3 setup_agentcore_agents.py

# Test
python3 test_agentcore_workflow.py
```

### Environment Variables

```bash
# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# IAM
AGENTCORE_EXECUTION_ROLE_ARN=arn:aws:iam::556316456032:role/AgentCoreMemoryRole

# Lambda Functions
LAMBDA_JOB_MARKET_TOOLS_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD_JobMarketTools
LAMBDA_NEBULA_API_TOOLS_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD_NebulaAPITools
LAMBDA_PROJECT_TOOLS_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD_ProjectTools
LAMBDA_VALIDATE_JOBMARKET_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD_ValidateJobMarket
LAMBDA_VALIDATE_COURSE_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD_ValidateCourse
LAMBDA_VALIDATE_PROJECT_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD_ValidateProject

# API Keys
NEBULA_API_KEY=your_nebula_api_key
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_KEY=your_kaggle_key

# Agents
AGENTCORE_PLANNER_AGENT_ID=VEGZEB5SHM
AGENTCORE_PLANNER_ALIAS_ID=KVBBNAXDPS
AGENTCORE_JOB_AGENT_ID=CTFYALQVJP
AGENTCORE_JOB_ALIAS_ID=F2FO2J3U3E
AGENTCORE_COURSE_AGENT_ID=6AQGP6TGXL
AGENTCORE_COURSE_ALIAS_ID=HGMKLX9RRC
AGENTCORE_PROJECT_AGENT_ID=3RE8BXKK3G
AGENTCORE_PROJECT_ALIAS_ID=IBQ1Y3VKAE
```

---

## Project Structure

```
backend/
├── setup_agentcore_agents.py      # Creates all agents
├── deploy_lambda.py                # Deploys Lambda function
├── test_agentcore_workflow.py     # End-to-end test
├── lambda_job_market_tools.py     # Lambda source code
├── lambda_requirements.txt         # Lambda dependencies
├── job_market_tools_lambda.zip    # Lambda deployment package
└── AGENTCORE_ARCHITECTURE.md      # This file
```

---

## API Usage

### Invoke Supervisor

```python
import boto3

client = boto3.client('bedrock-agent-runtime')

response = client.invoke_agent(
    agentId='T3TCF2QM9X',
    agentAliasId='ESEHZN8RYR',
    sessionId='user-123',
    inputText='I want to become a data scientist'
)

for event in response['completion']:
    if 'chunk' in event:
        text = event['chunk']['bytes'].decode('utf-8')
        print(text, end='')
```

### Response Format

```
To create a comprehensive career plan for becoming a data scientist...

[Supervisor delegates to JobMarketAgent]
[JobMarketAgent invokes Lambda tools]
[Lambda scrapes job data]
[JobMarketAgent analyzes results]

Based on current market trends:
- Python and SQL are essential skills
- Machine learning expertise is highly valued
- ...

[Supervisor delegates to CourseCatalogAgent]
Recommended UTD courses:
- CS 4375: Introduction to Machine Learning
- CS 4347: Database Systems
- ...

[Supervisor delegates to ProjectAdvisorAgent]
Suggested portfolio projects:
1. Build a predictive model for...
2. Create a data pipeline using...
...

[Supervisor synthesizes final plan]
```

---

## Performance Characteristics

| Metric                  | Value          |
| ----------------------- | -------------- |
| Cold start (first call) | ~3-5 seconds   |
| Warm call (subsequent)  | ~1-2 seconds   |
| Lambda invocation       | ~2-10 seconds  |
| End-to-end workflow     | ~15-30 seconds |
| Memory per agent        | ~512 MB        |
| Cost per 1000 requests  | ~$2-5          |

---

## Future Enhancements

### Phase 2

- [ ] Add knowledge bases for UTD course catalog
- [ ] Implement RAG for course descriptions
- [ ] Add guardrails for response quality
- [ ] Enable full streaming responses to UI

### Phase 3

- [ ] Add resume analysis agent
- [ ] Implement interview prep agent
- [ ] Create company research agent
- [ ] Add alumni network insights

### Phase 4
- [ ] Add AgentCore Observability
- [ ] Implement A/B testing
- [ ] Scale to 1000+ concurrent users

---

## Resources

- [AWS Bedrock Agents Docs](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [Multi-Agent Collaboration](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-multi-agent-collaboration.html)
- [Lambda Integration](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-lambda.html)

---

**Built for UTD Career Spark Hackathon 2025**  
_Powered by AWS Bedrock AgentCore & Claude 3_
