# run_demo.py
"""Web frontend entrypoint for the multi-agent UTD Career Guidance system."""

from __future__ import annotations

import logging
import os
import sys

from typing import Dict, Optional, Tuple

from flask import Flask, jsonify, redirect, render_template, request, session
from flask_cors import CORS

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
    ) -> Dict[str, object]:
        agentcore_runtime.record_user_goal(session_id, goal)
        context: Dict[str, str] = {"session_id": session_id}
        if extra_context:
            context.update({k: v for k, v in extra_context.items() if v})
        return planner.run_with_trace(
            goal,
            context=context,
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

    return app


def main() -> None:
    """Start the local development server for the web demo."""
    app = create_app()
    app_logger.info("===============================================")
    app_logger.info("UTD Career Guidance AI – Web Demo")
    app_logger.info("Open your browser to http://127.0.0.1:5000/")
    app_logger.info("Press CTRL+C to stop the server.")
    app_logger.info("===============================================")
    app_logger.info("Starting Flask development server on http://127.0.0.1:5000/")
    app.run(host="127.0.0.1", port=5000, debug=False)


if __name__ == "__main__":
    main()
