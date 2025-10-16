# UTD Career Spark Backend

A FastAPI-based backend for the UTD Career Spark application.

## Features

- FastAPI framework with automatic API documentation
- Uvicorn ASGI server
- CORS middleware for frontend integration
- Basic API routes structure
- Error handling
- Environment variable support

## Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file (optional, for environment variables):
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Running the Server

### Development Mode

Run the server with auto-reload enabled:

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, you can access:

- **Interactive API docs (Swagger UI)**: http://localhost:8000/docs
- **Alternative API docs (ReDoc)**: http://localhost:8000/redoc
- **OpenAPI schema**: http://localhost:8000/openapi.json

## Available Endpoints

- `GET /` - Root endpoint with welcome message
- `GET /health` - Health check endpoint
- `GET /api/users` - Get all users (placeholder)
- `GET /api/users/{user_id}` - Get specific user (placeholder)
- `POST /api/users` - Create new user (placeholder)

## Project Structure

```
backend/
├── main.py              # Main FastAPI application
├── requirements.txt     # Python dependencies
├── README.md           # This file
└── .env.example        # Environment variables template
```

## Development Notes

- The server runs on `http://localhost:8000` by default
- CORS is configured to allow requests from `http://localhost:3000` and `http://localhost:5173`
- Auto-reload is enabled in development mode for easier development
- All API routes are prefixed with `/api` for organization

## Next Steps

- Add database integration (SQLAlchemy, PostgreSQL, etc.)
- Implement authentication and authorization
- Add data models and schemas
- Create more specific API endpoints for your application needs
- Add logging and monitoring
- Set up testing framework
