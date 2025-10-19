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
            "Format your response using this exact structure:\n\n"
            "Here are project ideas and technology stacks for ... targeting ... with ... availability:\n\n"
            "1. ...\n"
            "- Problem: ...\n"
            "- Tech Stack: ...\n"
            "- Scope: ...\n"
            "- Stretch Goals: ...\n"
            "- Showcase: ...\n\n"
            "2. ...\n"
            "- Problem: ...\n"
            "- Tech Stack: ...\n"
            "- Scope: ...\n"
            "- Stretch Goals: ...\n"
            "- Showcase: ...\n\n"
            "3. ...\n"
            "- Problem: ...\n"
            "- Tech Stack: ...\n"
            "- Scope: ...\n"
            "- Stretch Goals: ...\n"
            "- Showcase: ...\n\n"
            "Datasets and Competitions:\n"
            "- ...: ...\n"
            "- ...: ...\n"
            "- ...: ...\n\n"
            "Showcase Your Work:\n"
            "- ... to demonstrate ...\n"
            "- ... to highlight ...\n"
            "- ... to prove ...\n\n"
            "Next Steps:\n"
            "- ... for ...\n"
            "- ... through ...\n"
            "- ... via ...\n\n"
            "Dependencies and Support:\n"
            "- ...\n"
            "- ...\n"
            "- ...\n\n"
            "Include 2-3 projects, 3-5 datasets/competitions, 3-5 showcase methods, 3-5 next steps, and address dependencies/support needs."
        )
        return "\n\n".join(sections)
