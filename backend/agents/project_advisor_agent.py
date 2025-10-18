# agents/project_advisor_agent.py
"""Claude agent recommending portfolio projects and technologies."""

from __future__ import annotations

from typing import Dict, Optional

from agents.base_agent import BaseAgent


class ProjectAdvisorAgent(BaseAgent):
    """Suggest hands-on projects and technologies to build a standout portfolio."""

    role_name = "Project Advisor"
    role_description = (
        "Design practical, scoped project ideas and technology stacks that align with the student's target roles."
    )

    def build_prompt(
        self,
        query: str,
        context: Optional[Dict[str, str]] = None,
    ) -> str:
        """Prepare a project-planning prompt for Claude."""
        context = context or {}
        job_insights = context.get("job_insights", "")
        course_map = context.get("course_map", "")
        time_commitment = context.get("time_commitment", "5-10 hours per week")
        student_background = context.get("student_background", "")
        courses_taken = context.get("courses_taken", "")

        sections = [
            f"Student goal: {query.strip() or 'Recommend projects that open doors to high-growth roles.'}",
            "Task: Recommend portfolio projects, hackathon ideas, and technologies that prove readiness.",
            f"Assume the student can invest approximately {time_commitment}.",
        ]
        if student_background:
            sections.append(f"Student background: {student_background}")
        if courses_taken:
            sections.append(f"Relevant coursework already completed: {courses_taken}")
        if job_insights:
            sections.append(f"Anchor the project ideas to these market insights:\n{job_insights}")
        if course_map:
            sections.append(f"Reference the following course roadmap when recommending tools:\n{course_map}")

        sections.append(
            "Output format:\n"
            "- 2-3 project concepts (each with problem statement, tech stack, scope, stretch goals)\n"
            "- Suggested datasets, APIs, or competitions to join\n"
            "- How to showcase results (GitHub, demo day, LinkedIn, etc.)\n"
            "- Technologies or frameworks to learn next\n"
            "- Metrics or rubrics for success"
        )
        sections.append("Call out dependencies or support the student might need from mentors or peers.")
        return "\n\n".join(sections)
