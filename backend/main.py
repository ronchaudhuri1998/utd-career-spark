from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from typing import Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create FastAPI instance
app = FastAPI(
    title="UTD Career Spark API",
    description="Backend API for UTD Career Spark application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
    ],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/")
async def root():
    return {"message": "UTD Career Spark API is running!"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is operational"}


# Basic API routes
@app.get("/api/users")
async def get_users():
    """Get all users - placeholder for now"""
    return {"users": [], "message": "Users endpoint - to be implemented"}


@app.get("/api/users/{user_id}")
async def get_user(user_id: int):
    """Get a specific user by ID"""
    if user_id < 1:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    return {"user_id": user_id, "message": "User endpoint - to be implemented"}


@app.post("/api/users")
async def create_user(user_data: Dict[str, Any]):
    """Create a new user"""
    return {"message": "User creation endpoint - to be implemented", "data": user_data}


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404, content={"message": "Endpoint not found", "detail": str(exc)}
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal server error",
            "detail": "An unexpected error occurred",
        },
    )


if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info",
    )
