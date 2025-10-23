"""UTD Career Spark API - FastAPI backend with AWS Bedrock AgentCore."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict, List
import json
import os
import uuid
import logging
from dotenv import load_dotenv

from claude_client import claude_chat
from agentcore_orchestrator import AgentCoreOrchestrator

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="UTD Career Spark API",
    description="Career guidance system powered by AWS Bedrock AgentCore",
    version="2.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize AgentCore orchestrator
orchestrator = AgentCoreOrchestrator()


# Pydantic Models
class IntroRequest(BaseModel):
    goal: str
    session_id: Optional[str] = None


class PlanRequest(BaseModel):
    goal: str
    session_id: Optional[str] = None
    # User profile fields
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    user_location: Optional[str] = None
    user_major: Optional[str] = None
    graduation_year: Optional[str] = None
    gpa: Optional[str] = None
    bio: Optional[str] = None
    career_goal: Optional[str] = None
    student_year: Optional[str] = None
    courses_taken: Optional[str] = None
    time_commitment: Optional[str] = None
    skills: Optional[str] = None  # comma-separated
    experience: Optional[str] = None  # JSON string
    # Legacy fields for backward compatibility
    about: Optional[str] = None
    contact_email: Optional[str] = None


class ProcessGoalRequest(BaseModel):
    goal: str


# Helper Functions
def generate_session_id() -> str:
    """Generate a unique session identifier."""
    return uuid.uuid4().hex


def classify_goal(goal: str) -> tuple[bool, str]:
    """Classify if the goal is a legitimate career goal."""
    prompt = (
        "Determine if the following user statement expresses a legitimate career goal or request for career guidance.\n"
        "Respond with either:\n"
        "ALLOW: <very short rationale>\n"
        "REJECT: <brief reason why it's not a career goal>\n\n"
        f"User statement: {goal.strip()}\n"
    )
    try:
        result = claude_chat(
            prompt,
            system_prompt="You are a strict classifier for career-goal intents.",
            max_tokens=60,
            temperature=0,
        ).strip()
    except Exception:
        # Fallback to keyword check
        lowered = goal.lower()
        keywords = [
            "career",
            "job",
            "role",
            "position",
            "engineer",
            "consult",
            "manager",
            "designer",
            "analyst",
        ]
        if any(word in lowered for word in keywords):
            return True, "ALLOW: heuristic keyword match"
        return False, "REJECT: does not appear to be a role or career goal."

    if result.upper().startswith("ALLOW"):
        return True, result
    if result.upper().startswith("REJECT"):
        return False, result
    return False, f"REJECT: Unexpected classifier output ({result})"


def generate_intro_message(goal: str) -> str:
    """Generate a welcoming intro message for the career goal."""
    prompt = (
        "The student said their primary career goal is:"
        f" {goal}.\n"
        "Respond in exactly two sentences:\n"
        "1) Celebrate the goal and mention one or two exciting aspects or opportunities, including a concise salary hint if known.\n"
        "2) Ask them to share their current year, recent courses or experiences, and weekly time commitment; remind them they can sign up later so their details are saved.\n"
        "Keep the tone upbeat, stay under 70 words total, and focus strictly on academics, skills, and career planning."
    )
    return claude_chat(
        prompt,
        system_prompt="You are a concise, energizing career coach who keeps responses under 120 words.",
        max_tokens=180,
        temperature=0.3,
    ).strip()


def process_career_goal(natural_language_goal: str) -> str:
    """Process natural language career goal into a structured format."""
    prompt = (
        f"Transform this natural language career goal into a clear, professional career goal statement:\n\n"
        f"Original: {natural_language_goal}\n\n"
        f"Create a single, well-written paragraph (3-4 sentences) that describes their career aspirations. "
        f"Write it as a flowing narrative, not a bulleted list. "
        f"Start with their desired role, mention key skills/technologies, and end with their long-term vision. "
        f"Make it sound natural and professional, like something they would write in a bio or resume summary. "
        f"Output ONLY the career goal statement, no introductory text or explanations."
    )
    try:
        return claude_chat(
            prompt,
            system_prompt="You are a career guidance expert. Output ONLY the career goal statement. Do not include any introductory text, explanations, or formatting. Just return the goal statement itself.",
            max_tokens=200,
            temperature=0.3,
        ).strip()
    except Exception:
        return natural_language_goal


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint - health check."""
    return {
        "status": "ok",
        "service": "UTD Career Spark API",
        "version": "2.0.0",
        "framework": "FastAPI + AWS Bedrock AgentCore",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "API is operational"}


@app.post("/api/intro")
async def api_intro(request: IntroRequest):
    """
    Validate career goal and generate welcoming intro message.

    This endpoint makes 2 direct Claude calls:
    1. Goal classification (ALLOW/REJECT)
    2. Intro message generation
    """
    goal = request.goal.strip()
    session_id = request.session_id or generate_session_id()

    if not goal:
        raise HTTPException(status_code=400, detail="Goal is required.")

    try:
        # Classify goal
        allowed, classifier_msg = classify_goal(goal)
        if not allowed:
            raise HTTPException(status_code=400, detail=classifier_msg)

        # Generate intro message
        message = generate_intro_message(goal)

        return {"message": message, "session_id": session_id}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate introduction: {exc}"
        )


@app.post("/api/plan")
async def api_plan_stream(request: PlanRequest):
    """
    Generate career plan using AWS AgentCore supervisor agent (SSE streaming).

    The supervisor agent:
    - Uses session memory to recall previous interactions
    - Decides autonomously whether to call collaborator agents
    - Streams responses in real-time via Server-Sent Events

    All follow-up questions should use the same session_id.
    """
    session_id = request.session_id or generate_session_id()

    # Check if request contains user profile fields (if frontend sent them)
    has_user_context = bool(
        request.user_name
        or request.user_email
        or request.user_major
        or request.graduation_year
        or request.gpa
        or request.career_goal
        or request.bio
        or request.student_year
        or request.courses_taken
        or request.time_commitment
        or request.skills
        or request.experience
    )

    # Build user context if present
    user_context = None
    if has_user_context:
        user_context = {
            "user_name": request.user_name or "",
            "user_email": request.user_email or request.contact_email or "",
            "user_phone": request.user_phone or "",
            "user_location": request.user_location or "",
            "user_major": request.user_major or "",
            "graduation_year": request.graduation_year or "",
            "gpa": request.gpa or "",
            "career_goal": request.career_goal or "",
            "bio": request.bio or request.about or "",
            "student_year": request.student_year or "",
            "courses_taken": request.courses_taken or "",
            "time_commitment": request.time_commitment or "",
            "skills": request.skills or "",
            "experience": request.experience or "",
        }
        logger.info(f"Building user context for session {session_id}")
        print(f"🔧 BACKEND: Full user context being sent to AgentCore:")
        for key, value in user_context.items():
            print(f"   {key}: {value}")

    if not request.goal.strip():
        raise HTTPException(status_code=400, detail="Goal is required.")

    async def event_generator():
        """Generate Server-Sent Events from AgentCore stream."""
        logger.info(
            f"Starting SSE stream for session {session_id} with goal: {request.goal[:100]}..."
        )

        try:
            # Send session ID first
            session_event = {"type": "session", "session_id": session_id}
            session_data = f"data: {json.dumps(session_event)}\n\n"
            logger.info(f"SSE Event [SESSION]: {session_event}")
            yield session_data

            # Stream events from AgentCore
            event_count = 0
            async for event in orchestrator.invoke_supervisor_stream(
                goal=request.goal, session_id=session_id, user_context=user_context
            ):
                event_count += 1
                event_data = f"data: {json.dumps(event)}\n\n"

                # Log only trace events with full data and agent/subagent responses
                if event.get("type") == "trace":
                    trace_data = event.get("data", {})
                    logger.info(
                        f"SSE Event [TRACE #{event_count}]: Full trace data: {trace_data}"
                    )

                    # Log agent/subagent responses separately
                    if "collaborator_response" in trace_data:
                        collab_resp = trace_data["collaborator_response"]
                        logger.info(f"Agent/Subagent Response: {collab_resp}")
                elif event.get("type") == "chunk":
                    # Only log chunk events if they contain agent responses
                    pass
                else:
                    # Log other event types minimally
                    logger.info(
                        f"SSE Event [{event.get('type', 'UNKNOWN')} #{event_count}]"
                    )

                yield event_data

            # Send completion event
            done_event = {"type": "done"}
            done_data = f"data: {json.dumps(done_event)}\n\n"
            logger.info(
                f"SSE Event [DONE]: Stream completed after {event_count} events"
            )
            yield done_data

        except Exception as exc:
            # Stream error event
            error_event = {"type": "error", "message": str(exc)}
            error_data = f"data: {json.dumps(error_event)}\n\n"
            logger.error(f"SSE Event [ERROR]: {exc}")
            yield error_data

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable proxy buffering
        },
    )


@app.get("/api/status")
async def api_status():
    """Get AgentCore agent configuration status."""
    return {
        "agents_configured": bool(orchestrator.planner_id),
        "planner_id": orchestrator.planner_id,
        "planner_alias_id": orchestrator.planner_alias_id,
        "region": os.getenv("AWS_REGION", "us-east-1"),
    }


@app.post("/api/process-career-goal")
async def api_process_career_goal(request: ProcessGoalRequest):
    """Process natural language career goal into structured format."""
    if not request.goal.strip():
        raise HTTPException(status_code=400, detail="Career goal is required.")

    try:
        processed_goal = process_career_goal(request.goal)
        return {"original_goal": request.goal, "processed_goal": processed_goal}
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to process career goal: {exc}"
        )


# Run with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
