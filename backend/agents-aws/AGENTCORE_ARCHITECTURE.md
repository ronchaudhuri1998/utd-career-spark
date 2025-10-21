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
│                         User Request                         │
│              "I want to become a data scientist"            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│            CareerPlannerAgent (SUPERVISOR)                   │
│  - Coordinates all specialist agents                         │
│  - Synthesizes responses                                     │
│  - Maintains session context                                 │
└──────────┬──────────────────┬──────────────────┬────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ JobMarketAgent   │ │CourseCatalogAgent│ │ProjectAdvisorAgent│
│                  │ │                  │ │                  │
│ Tools:           │ │ Knowledge:       │ │ Knowledge:       │
│ ├─Lambda: HN Jobs│ │ ├─UTD Courses   │ │ ├─Tech Stacks   │
│ └─Lambda: Skills │ │ └─Degrees       │ │ └─Project Ideas │
└──────────┬───────┘ └──────────────────┘ └──────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│         AWS Lambda: UTD-JobMarketTools                        │
│  - scrape_hackernews_jobs()                                   │
│  - scrape_itjobswatch_skills()                                │
└───────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│              External Data Sources                            │
│  - Hacker News Hiring Board                                   │
│  - IT Jobs Watch                                              │
└───────────────────────────────────────────────────────────────┘
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
- **Responsibilities**:
  - Recommend UTD courses
  - Suggest degree programs
  - Align academics with job market
  - Provide campus resources

### 4. ProjectAdvisorAgent (Collaborator)

- **Role**: Portfolio strategist
- **Type**: `COLLABORATOR`
- **Model**: Claude 3 Haiku
- **Responsibilities**:
  - Suggest portfolio projects
  - Recommend tech stacks
  - Guide hands-on learning
  - Align projects with job requirements

---

## Key Components

### Lambda Functions

```python
# Function: UTD-JobMarketTools
# Runtime: Python 3.11
# Timeout: 60 seconds
# Memory: 512 MB

def lambda_handler(event, context):
    function_name = event['function']

    if function_name == 'scrape_hackernews_jobs':
        return scrape_jobs()
    elif function_name == 'scrape_itjobswatch_skills':
        return scrape_skills()
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
| CareerPlanner  | T3TCF2QM9X | ESEHZN8RYR |
| JobMarket      | 61BLYEUNNP | FINFXHFOU0 |
| CourseCatalog  | 2GB15BFRJI | 1PPB20FIDJ |
| ProjectAdvisor | 5GGPMCAQSA | NDTAXBXU2L |

### Lambda Function

- **ARN**: `arn:aws:lambda:us-east-1:556316456032:function:UTD-JobMarketTools`
- **Runtime**: Python 3.11
- **Dependencies**: requests, beautifulsoup4

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

# Lambda
LAMBDA_JOB_MARKET_TOOLS_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-JobMarketTools

# Agents
AGENTCORE_PLANNER_AGENT_ID=T3TCF2QM9X
AGENTCORE_PLANNER_ALIAS_ID=ESEHZN8RYR
AGENTCORE_JOB_AGENT_ID=61BLYEUNNP
AGENTCORE_JOB_ALIAS_ID=FINFXHFOU0
AGENTCORE_COURSE_AGENT_ID=2GB15BFRJI
AGENTCORE_COURSE_ALIAS_ID=1PPB20FIDJ
AGENTCORE_PROJECT_AGENT_ID=5GGPMCAQSA
AGENTCORE_PROJECT_ALIAS_ID=NDTAXBXU2L
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
- [ ] Enable streaming responses to UI

### Phase 3

- [ ] Add resume analysis agent
- [ ] Implement interview prep agent
- [ ] Create company research agent
- [ ] Add alumni network insights

### Phase 4

- [ ] Deploy to AgentCore Runtime (serverless)
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
