# claude_client.py
# claude_client.py
"""Thin re-export of the claude_chat helper defined in claude_orchestrator.py."""

from claude_orchestrator import claude_chat  # noqa: F401 re-export

__all__ = ["claude_chat"]
