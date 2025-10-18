"""Utilities that connect the demo to AWS Bedrock AgentCore services."""

from __future__ import annotations

import logging
import os
import textwrap
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Sequence, Tuple

import boto3
from botocore.exceptions import ClientError

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional in some runtimes
    load_dotenv = None  # type: ignore[assignment]

logger = logging.getLogger("career_guidance.agentcore")


def _default_region() -> str:
    """Locate the region from env vars or fall back."""
    return (
        os.environ.get("AWS_REGION")
        or os.environ.get("AWS_DEFAULT_REGION")
        or "us-east-1"
    )


def _truncate(text: str, *, limit: int = 1800) -> str:
    """Avoid pushing extremely long payloads into AgentCore memory."""
    text = text.strip()
    if len(text) <= limit:
        return text
    return textwrap.shorten(text, width=limit, placeholder=" …")


@dataclass(frozen=True)
class AgentEvent:
    """Normalized event payload describing an agent action."""

    session_id: str
    actor: str
    role: str
    text: str


class AgentCoreRuntime:
    """Thin helper around AgentCore Memory to capture cross-agent activity."""

    def __init__(
        self,
        *,
        region: Optional[str] = None,
        memory_name: str = "utd-career-roadmap-memory",
    ) -> None:
        self.region = region or _default_region()
        self.memory_name = memory_name
        self._control_client = None
        self._runtime_client = None
        self._memory_id: Optional[str] = None
        self._available = False
        self._status_message: str = (
            "AgentCore disabled (set USE_AGENTCORE=1 in environment to enable)."
        )
        self._explicitly_enabled = os.getenv("USE_AGENTCORE", "0") == "1"
        self._execution_role_arn = os.getenv("AGENTCORE_EXECUTION_ROLE_ARN", "").strip()
        self._event_expiry_days = int(os.getenv("AGENTCORE_EVENT_EXPIRY_DAYS", "90"))
        self._memory_id_override = os.getenv("AGENTCORE_MEMORY_ID", "").strip()

        if load_dotenv is not None:
            load_dotenv()

        if self._explicitly_enabled:
            self._status_message = "AgentCore runtime initializing..."
            self._bootstrap()

    # ------------------------------------------------------------------ #
    # Public API                                                         #
    # ------------------------------------------------------------------ #

    @property
    def available(self) -> bool:
        """True when AgentCore memory calls are ready."""
        return self._available and self._runtime_client is not None and self._memory_id is not None

    @property
    def memory_id(self) -> Optional[str]:
        """Expose the underlying memory identifier when available."""
        return self._memory_id

    @property
    def status_message(self) -> str:
        """Human-readable status for dashboards or logs."""
        return self._status_message

    def record_events(self, events: Sequence[AgentEvent]) -> None:
        """Persist one or more events to AgentCore memory."""
        if not events or not self.available:
            return

        client = self._runtime_client
        memory_id = self._memory_id
        if client is None or memory_id is None:
            return

        batches: Dict[str, List[Tuple[str, str]]] = {}
        for event in events:
            if not event.text:
                continue
            key = self._make_session_key(event.session_id, event.actor)
            batches.setdefault(key, []).append((_truncate(event.text), event.role))

        for key, messages in batches.items():
            session_id, actor = key.split("::", 1)
            try:
                payload = []
                for text, role in messages:
                    payload.append(
                        {
                            "conversational": {
                                "content": {"text": _truncate(text)},
                                "role": role.upper(),
                            }
                        }
                    )

                client.create_event(
                    memoryId=memory_id,
                    actorId=actor,
                    sessionId=session_id,
                    eventTimestamp=datetime.utcnow(),
                    payload=payload,
                )
            except Exception as exc:  # pragma: no cover - network dependent
                logger.warning("Failed to persist AgentCore event (%s): %s", actor, exc)
                self._available = False
                self._status_message = f"AgentCore event write failed: {exc}"

    def record_user_goal(self, session_id: str, goal: str) -> None:
        """Convenience for capturing the raw user request."""
        if not goal or not self.available:
            return
        self.record_events(
            [
                AgentEvent(
                    session_id=session_id,
                    actor="Student",
                    role="USER",
                    text=goal,
                )
            ]
        )

    def record_agent_output(self, session_id: str, agent_name: str, text: str) -> None:
        """Persist an individual agent's response."""
        if not text or not self.available:
            return
        self.record_events(
            [
                AgentEvent(
                    session_id=session_id,
                    actor=agent_name,
                    role="ASSISTANT",
                    text=text,
                )
            ]
        )

    def allocate_session(self) -> str:
        """Generate a deterministic session identifier."""
        return uuid.uuid4().hex

    # ------------------------------------------------------------------ #
    # Internal helpers                                                   #
    # ------------------------------------------------------------------ #

    def _bootstrap(self) -> None:
        """Create shared memory constructs if AgentCore is reachable."""
        try:
            self._control_client = boto3.client("bedrock-agentcore-control", region_name=self.region)
            self._runtime_client = boto3.client("bedrock-agentcore", region_name=self.region)
        except Exception as exc:  # pragma: no cover - network dependent
            logger.info("Unable to create AgentCore clients: %s", exc)
            self._status_message = f"Unable to initialize AgentCore clients: {exc}"
            return

        if self._memory_id_override:
            self._memory_id = self._memory_id_override
            self._available = True
            self._status_message = f"Using AgentCore memory ({self._memory_id})."
            logger.info(self._status_message)
            return

        try:
            existing = self._find_memory_by_name(self.memory_name)
            if existing:
                self._memory_id = existing.get("id") or existing.get("memoryId")
                if self._memory_id:
                    self._available = True
                    self._status_message = f"Connected to AgentCore memory ({self._memory_id})."
                    logger.info(self._status_message)
                    return
        except ClientError as exc:
            logger.info("Unable to list AgentCore memories: %s", exc)
            self._status_message = f"Unable to list AgentCore memories: {exc.response['Error']['Message']}"
            return
        except Exception as exc:  # pragma: no cover
            logger.info("Unable to list AgentCore memories: %s", exc)
            self._status_message = f"Unable to list AgentCore memories: {exc}"
            return

        if not self._execution_role_arn:
            self._status_message = (
                "Unable to initialize AgentCore memory: set AGENTCORE_EXECUTION_ROLE_ARN or AGENTCORE_MEMORY_ID."
            )
            logger.warning(self._status_message)
            return

        try:
            response = self._control_client.create_memory(
                name=self.memory_name,
                description="Session memory for the UTD Career Guidance agents.",
                eventExpiryDuration=self._event_expiry_days,
                memoryExecutionRoleArn=self._execution_role_arn,
            )
            memory = response.get("memory", {})
            self._memory_id = memory.get("id") or memory.get("memoryId")
            if self._memory_id:
                self._available = True
                self._status_message = f"Connected to AgentCore memory ({self._memory_id})."
                logger.info(self._status_message)
            else:
                self._status_message = "AgentCore memory created but response lacked an id."
        except ClientError as exc:
            error = exc.response["Error"]
            code = error.get("Code")
            message = error.get("Message", str(exc))
            if code in {"ConflictException", "ResourceAlreadyExistsException"}:
                try:
                    existing = self._find_memory_by_name(self.memory_name)
                    if existing:
                        self._memory_id = existing.get("id") or existing.get("memoryId")
                        if self._memory_id:
                            self._available = True
                            self._status_message = f"Connected to AgentCore memory ({self._memory_id})."
                            logger.info(self._status_message)
                            return
                except Exception as list_exc:  # pragma: no cover
                    logger.info("Failed to retrieve existing memory after conflict: %s", list_exc)
            self._available = False
            self._status_message = f"Unable to initialize AgentCore memory: {message}"
        except Exception as exc:  # pragma: no cover - network dependent
            logger.info("AgentCore initialization skipped: %s", exc)
            self._available = False
            self._status_message = f"Unable to initialize AgentCore memory: {exc}"

    def _find_memory_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        if self._control_client is None:
            return None
        paginator = self._control_client.get_paginator("list_memories")
        for page in paginator.paginate():
            for memory in page.get("memories", []):
                mem_name = memory.get("name") or memory.get("memoryName")
                mem_id = memory.get("id") or memory.get("memoryId")
                if mem_name == name or mem_id == name:
                    return memory
        return None

    @staticmethod
    def _make_session_key(session_id: str, actor: str) -> str:
        return f"{session_id}::{actor or 'agent'}"


# Shared runtime used by the Flask app.
runtime = AgentCoreRuntime()
