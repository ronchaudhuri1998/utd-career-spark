# Backend - UTD Career Spark

FastAPI-based backend application for the UTD Career Spark platform, providing RESTful APIs and data management services.

## 🛠️ Tech Stack

- **Python 3.11+** - Programming language
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **AWS Bedrock AgentCore** - Multi-agent orchestration
- **Claude 3 Haiku** - AI model for direct calls
- **Lambda Functions** - Custom tools for data collection
- **boto3/aioboto3** - AWS SDK
- **Pydantic** - Data validation
- **Python-dotenv** - Environment variable management

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   
   **On macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```
   
   **On Windows:**
   ```bash
   venv\Scripts\activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the development server:**
   ```bash
   python run.py
   ```

6. **Access the API:**
   - API: `http://localhost:8000`
   - Interactive docs: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## 📁 Project Structure

```
backend/
├── venv/                   # Virtual environment (not in git)
├── main.py                 # FastAPI application entry point
├── run.py                  # Development server runner
├── claude_client.py        # Claude AI integration
├── agentcore_orchestrator.py # AgentCore multi-agent orchestration
├── agentcore_runtime.py   # AgentCore runtime utilities
├── general_chat.py         # General chat functionality
├── requirements.txt        # Python dependencies
├── agents-aws/            # AWS AgentCore implementation
│   ├── setup_agentcore_agents.py
│   ├── job/               # Job market Lambda tools
│   ├── nebula/            # Nebula API Lambda tools
│   ├── projects/          # Project recommendation Lambda tools
│   └── validation/        # Format validation Lambda tools
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# AWS Bedrock AgentCore Configuration
USE_AGENTCORE=1
AGENTCORE_EXECUTION_ROLE_ARN=arn:aws:iam::556316456032:role/AgentCoreMemoryRole
AGENTCORE_MEMORY_ID=CareerAdvisorMemory-fN37Om3xKY

# Agent IDs (use our deployed agents)
AGENTCORE_PLANNER_AGENT_ID=VEGZEB5SHM
AGENTCORE_PLANNER_ALIAS_ID=KVBBNAXDPS

# AWS Configuration
AWS_REGION=us-east-1

# Lambda Functions (deployed)
LAMBDA_JOB_MARKET_TOOLS_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-JobMarketTools
LAMBDA_NEBULA_API_TOOLS_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-NebulaAPITools
LAMBDA_PROJECT_TOOLS_ARN=arn:aws:lambda:us-east-1:556316456032:function:UTD-ProjectTools

# API Keys (for external services)
NEBULA_API_KEY=your_nebula_api_key
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_KEY=your_kaggle_key
```

### Dependencies

The project uses the following key dependencies:

- **fastapi** - Modern, fast web framework
- **uvicorn** - ASGI server with standard extras
- **bedrock-agentcore** - AWS Bedrock AgentCore SDK
- **boto3/aioboto3** - AWS SDK for Python
- **python-dotenv** - Environment variable loading
- **pydantic** - Data validation and settings
- **httpx** - HTTP client for async requests

## 🚀 Development

### Running the Server

**Development mode (with auto-reload):**
```bash
python run.py
```

**Production mode:**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

**With custom settings:**
```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### API Endpoints

The FastAPI application provides automatic API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

### Adding New Dependencies

1. **Install the package:**
   ```bash
   pip install package-name
   ```

2. **Update requirements.txt:**
   ```bash
   pip freeze > requirements.txt
   ```

3. **Or add manually to requirements.txt:**
   ```
   package-name==version
   ```

## 🏗️ API Structure

### Main Application

The main FastAPI application is defined in `main.py` with AgentCore integration:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from agentcore_orchestrator import AgentCoreOrchestrator

app = FastAPI(
    title="UTD Career Spark API",
    description="Career guidance system powered by AWS Bedrock AgentCore",
    version="2.0.0"
)

# Initialize AgentCore orchestrator
orchestrator = AgentCoreOrchestrator()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Lambda Functions

The backend integrates with 6 custom Lambda functions:

1. **UTD-JobMarketTools** - Web scraping (Hacker News, IT Jobs Watch)
2. **UTD-NebulaAPITools** - UTD course/professor data via Nebula API
3. **UTD-ProjectTools** - Project recommendations (GitHub, ArXiv, Hugging Face, Kaggle)
4. **UTD-ValidateJobMarket** - Job market format validation
5. **UTD-ValidateCourse** - Course format validation
6. **UTD-ValidateProject** - Project format validation

### Development Server

The `run.py` file provides a simple way to run the development server:

```python
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )
```

## 🔒 Security

### Authentication

The backend uses JWT tokens for authentication:

- **Secret Key**: Configured via environment variables
- **Algorithm**: HS256
- **Token Expiration**: Configurable (default: 30 minutes)

### CORS

Cross-Origin Resource Sharing is configured to allow requests from the frontend:

- **Allowed Origins**: `http://localhost:8000` (frontend)
- **Methods**: All HTTP methods
- **Headers**: All headers

## 🧪 Testing

### Manual Testing

Use the interactive API documentation at `http://localhost:8000/docs` to test endpoints.

### Automated Testing

Consider adding automated tests:

```bash
# Install testing dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## 📊 Monitoring

### Health Check

Add a health check endpoint:

```python
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
```

### Logging

Configure logging for production:

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

## 🚀 Deployment

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Cloud Deployment

The backend can be deployed to:
- **AWS Lambda** with Mangum
- **Google Cloud Run**
- **Heroku**
- **DigitalOcean App Platform**
- **Railway**

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Kill process using port 8000
   lsof -ti:8000 | xargs kill -9
   ```

2. **Virtual environment issues:**
   ```bash
   # Remove and recreate venv
   rm -rf venv
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Import errors:**
   ```bash
   # Ensure you're in the correct directory
   pwd  # Should show .../backend
   ```

4. **Dependencies conflicts:**
   ```bash
   # Create fresh environment
   pip freeze > requirements-backup.txt
   pip uninstall -r requirements.txt -y
   pip install -r requirements.txt
   ```

### Performance

- Use async/await for I/O operations
- Implement connection pooling for databases
- Add caching for frequently accessed data
- Monitor memory usage and response times

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
- [Pydantic Documentation](https://pydantic-docs.helpmanual.io/)
- [Python Virtual Environments](https://docs.python.org/3/tutorial/venv.html)

## 🤝 Contributing

1. Follow PEP 8 style guidelines
2. Add type hints to all functions
3. Write docstrings for all public functions
4. Test your changes thoroughly
5. Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the main [README](../README.md) for details.