# run_demo.py
"""Web frontend entrypoint for the multi-agent UTD Career Guidance system."""

from __future__ import annotations

import logging
import os
import sys
import queue
import threading

from typing import Dict, Optional, Tuple

from flask import Flask, jsonify, redirect, render_template, request, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit

from agentcore_runtime import runtime as agentcore_runtime
from agents.career_planner_agent import CareerPlannerAgent
from claude_client import claude_chat
from general_chat import generate_general_reply


LOGGER_NAME = "career_guidance"


def _configure_logging() -> logging.Logger:
    """Set up structured console logging for agent narration."""
    logger = logging.getLogger(LOGGER_NAME)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
        )
        logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False
    logging.getLogger("werkzeug").setLevel(logging.WARNING)
    return logger


app_logger = _configure_logging()

# Instantiate planner once so the sub-agents (and their caches) persist across requests.
planner = CareerPlannerAgent(agentcore_runtime=agentcore_runtime)

# Track running workflows to prevent duplicates
running_workflows = set()

AGENT_META = {
    "JobMarketAgent": {
        "label": "Job Market Agent",
        "color": "info",
        "icon": "briefcase",
    },
    "CourseCatalogAgent": {
        "label": "Course Catalog Agent",
        "color": "success",
        "icon": "book",
    },
    "ProjectAdvisorAgent": {
        "label": "Project Advisor Agent",
        "color": "warning",
        "icon": "lightbulb",
    },
    "CareerPlannerAgent": {
        "label": "Career Planner",
        "color": "primary",
        "icon": "diagram-project",
    },
}


def create_app() -> Flask:
    """Create the Flask application that drives the career guidance UI."""
    app = Flask(__name__)
    app.secret_key = os.getenv("FLASK_SECRET_KEY", "career-guidance-demo")
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize SocketIO
    socketio = SocketIO(app, cors_allowed_origins="*")

    def _ensure_session_id(existing: str = "") -> str:
        """Persist and return the AgentCore session id associated with this client."""
        sid = existing or session.get("agentcore_session_id", "")
        if not sid:
            sid = agentcore_runtime.allocate_session()
            session["agentcore_session_id"] = sid
            app_logger.info("Allocated AgentCore session: %s", sid)
        elif session.get("agentcore_session_id") != sid:
            session["agentcore_session_id"] = sid
        return sid

    def _agentcore_payload() -> Dict[str, object]:
        return {
            "available": agentcore_runtime.available,
            "status": agentcore_runtime.status_message,
            "memory_id": agentcore_runtime.memory_id,
            "memory_name": agentcore_runtime.memory_name,
        }

    def _classify_goal(goal: str) -> Tuple[bool, str]:
        """Return (is_career_goal, message)."""
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
        except Exception as exc:  # pragma: no cover - fallback heuristics
            app_logger.warning("Goal classification failed (%s). Falling back to keyword check.", exc)
            lowered = goal.lower()
            keywords = ["career", "job", "role", "position", "engineer", "consult", "manager", "designer", "analyst"]
            if any(word in lowered for word in keywords):
                return True, "ALLOW: heuristic keyword match"
            return False, "REJECT: does not appear to be a role or career goal."

        if result.upper().startswith("ALLOW"):
            return True, result
        if result.upper().startswith("REJECT"):
            return False, result
        # Unexpected format - treat cautiously
        return False, f"REJECT: Unexpected classifier output ({result})"

    def _run_workflow(
        goal: str,
        session_id: str,
        *,
        extra_context: Optional[Dict[str, str]] = None,
        update_queue: Optional[queue.Queue] = None,
    ) -> Dict[str, object]:
        agentcore_runtime.record_user_goal(session_id, goal)
        context: Dict[str, str] = {"session_id": session_id}
        if extra_context:
            context.update({k: v for k, v in extra_context.items() if v})
        return planner.run_with_trace(
            goal,
            context=context,
            update_queue=update_queue,
        )

    def _generate_intro_message(goal: str) -> str:
        prompt = (
            "The student said their primary career goal is:"
            f" {goal}.\n"
            "Respond in exactly two sentences:\n"
            "1) Celebrate the goal and mention one or two exciting aspects or opportunities, including a concise salary hint if known.\n"
            "2) Ask them to share their current year, recent courses or experiences, and weekly time commitment; remind them they can sign up later so their details are saved.\n"
            "Keep the tone upbeat, stay under 70 words total, and focus strictly on academics, skills, and career planning."
        )
        try:
            return (
                claude_chat(
                    prompt,
                    system_prompt="You are a concise, energizing career coach who keeps responses under 120 words.",
                    max_tokens=180,
                    temperature=0.3,
                ).strip()
            )
        except Exception as exc:  # pragma: no cover - best-effort fallback
            app_logger.warning("Intro generation failed, returning error message: %s", exc)
            raise

    def _process_career_goal(natural_language_goal: str) -> str:
        """Process natural language career goal into a structured, actionable format."""
        prompt = (
            f"Transform this natural language career goal into a clear, professional career goal statement:\n\n"
            f"Original: {natural_language_goal}\n\n"
            f"Create a single, well-written paragraph (3-4 sentences) that describes their career aspirations. "
            f"Write it as a flowing narrative, not a bulleted list. "
            f"Start with their desired role, mention key skills/technologies, and end with their long-term vision. "
            f"Make it sound natural and professional, like something they would write in a bio or resume summary."
        )
        try:
            return claude_chat(
                prompt,
                system_prompt="You are a career guidance expert who helps students write clear, professional career goal statements. Write as a single flowing paragraph, not a list.",
                max_tokens=200,
                temperature=0.3,
            ).strip()
        except Exception as exc:
            app_logger.warning("Career goal processing failed: %s", exc)
            # Fallback: return the original goal if processing fails
            return natural_language_goal

    @app.route("/", methods=["GET", "POST"])
    def index():
        goal = ""
        result = None
        error = None
        session_id = session.get("agentcore_session_id", "")

        frontend_url = os.getenv("FRONTEND_DEV_URL")
        if request.method == "GET" and frontend_url:
            app_logger.debug("Redirecting to frontend dev server at %s", frontend_url)
            return redirect(frontend_url)

        if request.method == "POST":
            goal = request.form.get("goal", "").strip()
            app_logger.info("Received new career goal: %s", goal or "<empty>")
            session_id = _ensure_session_id(session_id)

            if not goal:
                error = "Please enter a career goal."
            else:
                try:
                    result = _run_workflow(goal, session_id)
                    app_logger.info("Orchestrator completed roadmap synthesis.")
                except Exception as exc:  # pragma: no cover - surfaced to UI
                    error = f"Agent workflow failed: {exc}"
                    app_logger.exception("Agent workflow failed.")

        agentcore_info = _agentcore_payload()

        return render_template(
            "career_planner.html",
            goal=goal,
            result=result,
            error=error,
            agent_meta=AGENT_META,
            agentcore_info=agentcore_info,
            session_id=session_id,
        )

    @app.post("/api/intro")
    def api_intro():
        payload = request.get_json(silent=True) or {}
        goal = str(payload.get("goal", "")).strip()
        incoming_session_id = str(payload.get("session_id", "")).strip()
        session_id = _ensure_session_id(incoming_session_id)

        if not goal:
            return (
                jsonify(
                    {
                        "error": "Goal is required.",
                        "agentcore": _agentcore_payload(),
                    }
                ),
                400,
            )

        try:
            allowed, classifier_msg = _classify_goal(goal)
            if not allowed:
                return (
                    jsonify(
                        {
                            "error": classifier_msg,
                            "agentcore": _agentcore_payload(),
                        }
                    ),
                    400,
                )
            message = _generate_intro_message(goal)
        except Exception as exc:  # pragma: no cover - surfaced to client
            app_logger.exception("Intro generation failed.")
            return (
                jsonify(
                    {
                        "error": f"Failed to generate introduction: {exc}",
                        "agentcore": _agentcore_payload(),
                    }
                ),
                500,
            )

        agentcore_runtime.record_user_goal(session_id, goal)
        return jsonify(
            {
                "message": message,
                "session_id": session_id,
                "agentcore": _agentcore_payload(),
            }
        )

    @app.post("/api/plan")
    def api_plan():
        """JSON API consumed by the React frontend."""
        payload = request.get_json(silent=True) or {}
        goal = str(payload.get("goal", "")).strip()
        incoming_session_id = str(payload.get("session_id", "")).strip()
        session_id = _ensure_session_id(incoming_session_id)

        student_year = str(payload.get("student_year", "")).strip()
        courses_taken = str(payload.get("courses_taken", "")).strip()
        about = str(payload.get("about", "")).strip()
        time_commitment = str(payload.get("time_commitment", "")).strip()
        contact_email = str(payload.get("contact_email", "")).strip()

        extra_context: Dict[str, str] = {
            "student_background": about,
            "degree_level": student_year,
            "courses_taken": courses_taken,
            "time_commitment": time_commitment,
            "contact_email": contact_email,
        }

        if not goal:
            return (
                jsonify(
                    {
                        "error": "Goal is required.",
                        "agentcore": _agentcore_payload(),
                    }
                ),
                400,
            )

        try:
            result = _run_workflow(goal, session_id, extra_context=extra_context)
        except Exception as exc:  # pragma: no cover - surfaced to client
            app_logger.exception("Agent workflow failed (API).")
            return (
                jsonify(
                    {
                        "error": f"Agent workflow failed: {exc}",
                        "agentcore": _agentcore_payload(),
                    }
                ),
                500,
            )

        response = {
            "goal": goal,
            "session_id": session_id,
            "agentcore": _agentcore_payload(),
            "trace": result.get("trace", []),
            "final_plan": result.get("final_plan", ""),
            "job_market": result.get("job_market"),
            "course_plan": result.get("course_plan"),
            "project_recommendations": result.get("project_recommendations"),
        }
        return jsonify(response)

    @app.post("/api/chat")
    def api_chat():
        payload = request.get_json(silent=True) or {}
        message = str(payload.get("message", "")).strip()
        goal = str(payload.get("goal", "")).strip()
        incoming_session_id = str(payload.get("session_id", "")).strip()
        session_id = _ensure_session_id(incoming_session_id)
        history = payload.get("history") or []

        if not message:
            return (
                jsonify(
                    {
                        "error": "Message is required.",
                        "agentcore": _agentcore_payload(),
                    }
                ),
                400,
            )

        if not goal:
            return (
                jsonify(
                    {
                        "error": "Goal must be set before continuing the conversation.",
                        "agentcore": _agentcore_payload(),
                    }
                ),
                400,
            )

        try:
            reply = generate_general_reply(goal=goal, message=message, history=history)
        except Exception as exc:  # pragma: no cover - surfaced to client
            app_logger.exception("General chat failed.")
            reply = (
                "I'm running offline at the moment, but I'm still here for you. "
                "Let me know once the quick form is filled out and I'll generate your roadmap."
            )

        agentcore_runtime.record_agent_output(session_id, "Assistant", reply)
        return jsonify({"reply": reply, "session_id": session_id, "agentcore": _agentcore_payload()})

    @app.get("/api/status")
    def api_status():
        """Expose AgentCore status for onboarding UI."""
        return jsonify(_agentcore_payload())

    @app.post("/api/process-career-goal")
    def api_process_career_goal():
        """Process natural language career goal into structured format."""
        payload = request.get_json(silent=True) or {}
        natural_language_goal = str(payload.get("goal", "")).strip()

        if not natural_language_goal:
            return (
                jsonify(
                    {
                        "error": "Career goal is required.",
                        "agentcore": _agentcore_payload(),
                    }
                ),
                400,
            )

        try:
            # Process the natural language goal using Claude
            processed_goal = _process_career_goal(natural_language_goal)
            return jsonify(
                {
                    "original_goal": natural_language_goal,
                    "processed_goal": processed_goal,
                    "agentcore": _agentcore_payload(),
                }
            )
        except Exception as exc:
            app_logger.exception("Career goal processing failed.")
            return (
                jsonify(
                    {
                        "error": f"Failed to process career goal: {exc}",
                        "agentcore": _agentcore_payload(),
                    }
                ),
                500,
            )

    # WebSocket event handlers
    @socketio.on("start_plan")
    def handle_start_plan(data):
        """Handle WebSocket request to start agent workflow."""
        goal = data.get("goal", "").strip()
        session_id = data.get("session_id", "").strip()
        extra_context = data.get("extra_context", {})

        if not goal:
            emit("error", {"message": "Goal is required"})
            return

        # Create a queue for the thread to push updates to
        update_queue = queue.Queue()

        def run_workflow_thread():
            try:
                result = _run_workflow(
                    goal,
                    session_id,
                    extra_context=extra_context,
                    update_queue=update_queue,
                )
                update_queue.put({"type": "complete", "result": result})
            except Exception as exc:
                update_queue.put({"type": "error", "message": str(exc)})

        def monitor_queue():
            """Monitor the queue and emit WebSocket updates."""
            while True:
                try:
                    update = update_queue.get(timeout=0.1)
                    if "type" in update:
                        if update["type"] == "complete":
                            socketio.emit("plan_complete", update["result"])
                            break
                        elif update["type"] == "error":
                            socketio.emit("error", {"message": update["message"]})
                            break
                    else:
                        # This is an agent progress update from record()
                        app_logger.info(f"📡 Emitting agent_progress: {update}")
                        socketio.emit("agent_progress", update)
                except queue.Empty:
                    continue

        # Start the workflow in a separate thread
        workflow_thread = threading.Thread(target=run_workflow_thread)
        workflow_thread.start()

        # Start monitoring in another thread
        monitor_thread = threading.Thread(target=monitor_queue)
        monitor_thread.start()

    return app, socketio


def main() -> None:
    """Start the local development server for the web demo."""
    app, socketio = create_app()
    app_logger.info("===============================================")
    app_logger.info("UTD Career Guidance AI – Web Demo")
    app_logger.info("Open your browser to http://127.0.0.1:5000/")
    app_logger.info("Press CTRL+C to stop the server.")
    app_logger.info("===============================================")
    app_logger.info(
        "Starting Flask-SocketIO development server on http://127.0.0.1:5000/"
    )
    socketio.run(
        app, host="127.0.0.1", port=5000, debug=False, allow_unsafe_werkzeug=True
    )


if __name__ == "__main__":
    main()
