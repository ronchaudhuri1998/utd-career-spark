from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from typing import Dict, Any
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from claude_client import claude_chat

# Load environment variables
load_dotenv()


# Pydantic models
class CareerGoalRequest(BaseModel):
    goal: str


class CareerGoalResponse(BaseModel):
    original_goal: str
    processed_goal: str


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


def _process_career_goal(natural_language_goal: str) -> str:
    """Process natural language career goal into a structured, actionable format."""
    prompt = (
        f"Process this natural language career goal into a clear, structured career goal:\n\n"
        f"Original: {natural_language_goal}\n\n"
        f"Please transform this into a professional, specific career goal that includes:\n"
        f"1. The specific role or position\n"
        f"2. Key skills or technologies mentioned\n"
        f"3. Industry or domain focus\n"
        f"4. Any specific aspirations or specializations\n\n"
        f"Format the response as a clear, concise career goal statement (2-3 sentences max).\n"
        f"Make it professional and actionable for career planning purposes."
    )
    try:
        return claude_chat(
            prompt,
            system_prompt="You are a career guidance expert who helps students clarify and structure their career goals into professional, actionable statements.",
            max_tokens=200,
            temperature=0.2,
        ).strip()
    except Exception as exc:
        # Fallback: return the original goal if processing fails
        return natural_language_goal


@app.post("/api/career-goals/process", response_model=CareerGoalResponse)
async def process_career_goal(request: CareerGoalRequest):
    """Process natural language career goal into structured format."""
    if not request.goal.strip():
        raise HTTPException(status_code=400, detail="Career goal is required.")

    try:
        processed_goal = _process_career_goal(request.goal)
        return CareerGoalResponse(
            original_goal=request.goal, processed_goal=processed_goal
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to process career goal: {str(exc)}"
        )


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
