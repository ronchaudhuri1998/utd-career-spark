"""Lightweight Claude chat helper for free-form coaching responses."""

from __future__ import annotations

from typing import Iterable, List, Mapping

from claude_client import claude_chat


def _format_history(history: Iterable[Mapping[str, str]]) -> str:
    """Render a short transcript for Claude to ground follow-up replies."""
    lines: List[str] = []
    for item in history:
        role = item.get("role", "user").strip().lower()
        text = item.get("text", "").strip()
        if not text:
            continue
        role_label = "Student" if role == "user" else "Coach"
        lines.append(f"{role_label}: {text}")
    return "\n".join(lines[-10:])


def generate_general_reply(
    *,
    goal: str,
    message: str,
    history: Iterable[Mapping[str, str]] | None = None,
) -> str:
    """Produce a concise conversational reply without invoking orchestrated agents."""
    goal = goal.strip() or "undefined role"
    user_message = message.strip()
    transcript = _format_history(history or [])

    prompt_sections = [
        "You are a friendly career copilot helping a student explore opportunities.",
        f"The student's target role: {goal}.",
        "Respond to the latest student question with warmth, 2-3 concrete points, and keep it under 90 words.",
        "Stay focused on academics, skills, career strategy, or internships. If the student drifts to unrelated topics, politely guide them back to career planning.",
        "If relevant, remind them you can later assemble a detailed career plan with courses, projects, and job prep tips.",
        "Encourage them to share more about their background when helpful.",
    ]
    if transcript:
        prompt_sections.append("Conversation so far:\n" + transcript)
    prompt_sections.append(f"Student just said: {user_message or 'N/A'}")

    prompt = "\n\n".join(prompt_sections)
    return claude_chat(
        prompt,
        system_prompt="Be concise, supportive, and action-oriented. Never hallucinate data; if unsure, acknowledge it.",
        max_tokens=220,
        temperature=0.4,
    ).strip()
