# agents/career_planner_agent.py
"""Orchestrator agent that fuses results from specialized agents."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from agentcore_runtime import AgentCoreRuntime
from agents.base_agent import BaseAgent
from agents.course_catalog_agent import CourseCatalogAgent
from agents.job_market_agent import JobMarketAgent
from agents.project_advisor_agent import ProjectAdvisorAgent


logger = logging.getLogger("career_guidance.career_planner")


class CareerPlannerAgent(BaseAgent):
    """Coordinate specialized agents to deliver an actionable career roadmap."""

    role_name = "Career Planner Orchestrator"
    role_description = (
        "Synthesize job market research, academic guidance, and project advice into a cohesive, staged career plan."
    )

    def __init__(
        self,
        job_agent: Optional[JobMarketAgent] = None,
        course_agent: Optional[CourseCatalogAgent] = None,
        project_agent: Optional[ProjectAdvisorAgent] = None,
        *,
        agentcore_runtime: Optional[AgentCoreRuntime] = None,
        **kwargs: Any,
    ) -> None:
        self.agentcore_runtime = agentcore_runtime
        super().__init__(**kwargs)
        self.job_agent = job_agent or JobMarketAgent()
        self.course_agent = course_agent or CourseCatalogAgent()
        self.project_agent = project_agent or ProjectAdvisorAgent()

    def run_with_trace(
        self,
        query: str,
        *,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Run specialized agents and return their outputs plus a narration trace."""
        context = context or {}
        session_id = str(context.get("session_id", "") or "").strip()
        narration: List[Dict[str, str]] = []
        runtime = self.agentcore_runtime if session_id else None

        def record(agent: str, event: str, output: Optional[str] = None) -> None:
            """Append narration step and stream it to the logger."""
            logger.info("[%s] %s", agent, event)
            entry: Dict[str, str] = {"agent": agent, "event": event}
            if output:
                entry["output"] = output
                logger.debug("[%s] Output:\n%s", agent, output)
            narration.append(entry)
            if runtime and (output or event):
                payload = output or event
                runtime.record_agent_output(session_id, agent, payload)

        record("JobMarketAgent", "Analyzing hiring trends, growth roles, and critical skills.")
        job_context = context.get("job_market")
        job_inputs = job_context if isinstance(job_context, dict) else {}
        job_insights = self.job_agent.run(query, context=job_inputs)
        record("JobMarketAgent", "Completed labor market review.", job_insights)
        scrape_snapshot = getattr(self.job_agent, "last_scrape", {}) or {}
        if scrape_snapshot:
            record(
                "JobMarketAgent",
                "Latest web scrape signals.",
                self._format_scrape_snapshot(scrape_snapshot),
            )

        record(
            "CourseCatalogAgent",
            "Mapping market-aligned skills to UT Dallas coursework.",
        )
        course_context: Dict[str, Any] = {
            "job_insights": job_insights,
            "student_background": context.get("student_background", ""),
            "degree_level": context.get("degree_level", ""),
            "courses_taken": context.get("courses_taken", ""),
        }
        course_plan = self.course_agent.run(query, context=course_context)
        record(
            "CourseCatalogAgent",
            "Built course and campus resource roadmap.",
            course_plan,
        )

        record(
            "ProjectAdvisorAgent",
            "Designing portfolio project strategy and tech stack.",
        )
        project_context: Dict[str, Any] = {
            "job_insights": job_insights,
            "course_map": course_plan,
            "student_background": context.get("student_background", ""),
            "time_commitment": context.get("time_commitment", ""),
            "courses_taken": context.get("courses_taken", ""),
        }
        project_recommendations = self.project_agent.run(query, context=project_context)
        record(
            "ProjectAdvisorAgent",
            "Outlined project playbook and practice plan.",
            project_recommendations,
        )

        record(
            "CareerPlannerAgent",
            "Synthesizing expert inputs into a unified roadmap.",
        )
        orchestration_context: Dict[str, Any] = {
            "job_summary": job_insights,
            "course_plan": course_plan,
            "project_recommendations": project_recommendations,
            "timeline": context.get("timeline", ""),
            "student_background": context.get("student_background", ""),
            "courses_taken": context.get("courses_taken", ""),
            "time_commitment": context.get("time_commitment", ""),
        }
        final_plan = super().run(query, context=orchestration_context)
        record(
            "CareerPlannerAgent",
            "Generated final multi-semester career plan.",
            final_plan,
        )

        return {
            "job_market": job_insights,
            "course_plan": course_plan,
            "project_recommendations": project_recommendations,
            "final_plan": final_plan,
            "trace": narration,
        }

    def run(
        self,
        query: str,
        *,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Compatibility wrapper that returns only the final plan."""
        return self.run_with_trace(query, context=context)["final_plan"]

    def build_prompt(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Assemble the orchestrator prompt summarizing all agent inputs."""
        base_query = query.strip() or "Create an actionable career plan for this student."
        context = context or {}
        job_summary = str(context.get("job_summary", "")).strip()
        course_plan = str(context.get("course_plan", "")).strip()
        project_recommendations = str(context.get("project_recommendations", "")).strip()
        timeline = str(context.get("timeline", "")).strip() or "Recommend a 6-12 month timeline."
        student_background = str(context.get("student_background", "")).strip()
        courses_taken = str(context.get("courses_taken", "")).strip()
        time_commitment = str(context.get("time_commitment", "")).strip()

        sections = [
            f"Student goal: {base_query}",
            "You have already gathered the following expert inputs:",
        ]
        if job_summary:
            sections.append(f"Job market analysis:\n{job_summary}")
        if course_plan:
            sections.append(f"Course and campus resources:\n{course_plan}")
        if project_recommendations:
            sections.append(f"Portfolio projects & skill-building plan:\n{project_recommendations}")
        if student_background:
            sections.append(f"Student background or constraints:\n{student_background}")
        if courses_taken:
            sections.append(f"Completed or ongoing courses:\n{courses_taken}")
        if time_commitment:
            sections.append(f"Weekly time available: {time_commitment}")

        sections.extend([
            "Task: Combine these into a unified, staged career roadmap tailored to a UT Dallas student.",
            f"Timeline guidance: {timeline}",
            "Output format:",
            "- Executive summary (2-3 sentences)",
            "- Sequenced milestones (semester-by-semester or monthly)",
            "- Skills to focus on and how to validate them",
            "- Resources or support systems to leverage",
            "- Risks, blockers, or questions to clarify with advisors",
            "Structure the final plan with clearly labeled sections ready to share with mentors.",
        ])
        return "\n\n".join(sections)

    @staticmethod
    def _format_scrape_snapshot(snapshot: Dict[str, str]) -> str:
        """Utility to display scrape summaries in the narration trace."""
        parts = []
        roles = snapshot.get("roles_summary")
        if roles:
            parts.append(f"Live job postings summary:\n{roles}")
        skills = snapshot.get("skills_summary")
        if skills:
            parts.append(f"Skill demand snapshot:\n{skills}")
        notes = snapshot.get("notes")
        if notes:
            parts.append(f"Scrape notes:\n{notes}")
        return "\n\n".join(parts) if parts else "No scrape details available."
