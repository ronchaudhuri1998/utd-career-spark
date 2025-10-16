# Backend - UTD Career Spark

FastAPI-based backend application for the UTD Career Spark platform, providing RESTful APIs and data management services.

## 🛠️ Tech Stack

- **Python 3.8+** - Programming language
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Python-JOSE** - JWT token handling
- **Passlib** - Password hashing
- **Python-multipart** - Form data handling

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
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=sqlite:///./career_spark.db

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# API
API_V1_STR=/api/v1
PROJECT_NAME=UTD Career Spark
```

### Dependencies

The project uses the following key dependencies:

- **fastapi==0.104.1** - Modern, fast web framework
- **uvicorn[standard]==0.24.0** - ASGI server with standard extras
- **python-multipart==0.0.6** - Multipart form data parsing
- **python-jose[cryptography]==3.3.0** - JWT token handling
- **passlib[bcrypt]==1.7.4** - Password hashing
- **python-dotenv==1.0.0** - Environment variable loading

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

The main FastAPI application is defined in `main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="UTD Career Spark API",
    description="Backend API for UTD Career Spark platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

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

- **Allowed Origins**: `http://localhost:5173` (frontend)
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