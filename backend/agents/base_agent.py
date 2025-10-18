# agents/base_agent.py
"""Shared base agent for the UTD Career Guidance AI system."""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from claude_client import claude_chat


logger = logging.getLogger("career_guidance.base_agent")


class BaseAgent:
    """Base helper that wraps claude_chat with agent-specific prompts."""

    role_name = "Base Agent"
    role_description = ""

    def __init__(
        self,
        *,
        system_prompt: Optional[str] = None,
        max_tokens: int = 700,
        temperature: float = 0.2,
    ) -> None:
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.system_prompt = system_prompt or self._compose_system_prompt()

    def _compose_system_prompt(self) -> str:
        """Build the core system prompt combining shared and role-specific guidance."""
        description = self.role_description.strip()
        base_lines = [
            f"You are {self.role_name} within the UTD Career Guidance AI System.",
            description if description else "",
            "Be precise, cite trends or assumptions, and flag any missing data.",
            "Use short headings and bullet points so students can act immediately.",
        ]
        return "\n".join(line for line in base_lines if line)

    def build_prompt(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Prepare the text prompt sent to Claude. Subclasses override as needed."""
        context = context or {}
        query_text = query.strip() or "The student needs general career guidance."
        if not context:
            return query_text
        context_section = self._format_context(context)
        return f"{query_text}\n\nContext to include:\n{context_section}"

    @staticmethod
    def _format_context(context: Dict[str, Any]) -> str:
        """Format contextual data as readable sections for Claude."""
        formatted = []
        for key, value in context.items():
            value_text = str(value).strip()
            if not value_text:
                continue
            formatted.append(f"{key}:\n{value_text}")
        return "\n\n".join(formatted)

    def run(
        self,
        query: str,
        *,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Execute the agent against Claude with the composed system prompt."""
        prompt = self.build_prompt(query, context=context)
        logger.info("[%s] Dispatching prompt to Claude.", self.role_name)
        response = claude_chat(
            prompt,
            system_prompt=self.system_prompt,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
        )
        logger.info("[%s] Claude response received.", self.role_name)
        return response
