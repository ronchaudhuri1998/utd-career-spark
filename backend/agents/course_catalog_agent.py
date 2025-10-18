# agents/course_catalog_agent.py
"""Claude agent mapping job skills to UTD courses and resources."""

from __future__ import annotations

from typing import Dict, Optional

from agents.base_agent import BaseAgent


class CourseCatalogAgent(BaseAgent):
    """Recommend UTD courses aligned with in-demand skills."""

    role_name = "Course Catalog Specialist"
    role_description = (
        "Align employer-demanded skills with UT Dallas courses, certificates, and campus resources."
    )

    def build_prompt(
        self,
        query: str,
        context: Optional[Dict[str, str]] = None,
    ) -> str:
        """Compose a prompt that maps job skills to UTD courses."""
        context = context or {}
        job_insights = context.get("job_insights", "")
        student_background = context.get("student_background")
        degree_level = context.get("degree_level", "undergraduate or early graduate")
        courses_taken = context.get("courses_taken", "")

        sections = [
            f"Student goal: {query.strip() or 'Identify fitting courses at UT Dallas.'}",
            "Task: Translate job market needs into a course and resource roadmap for the student.",
            f"Assume the student is pursuing {degree_level} studies at UT Dallas.",
        ]
        if student_background:
            sections.append(f"Known student background or prerequisites: {student_background}")
        if courses_taken:
            sections.append(f"Courses or certifications already completed: {courses_taken}")
        if job_insights:
            sections.append(f"Market signals to align with:\n{job_insights}")

        sections.append(
            "Output format:\n"
            "- Core courses (include catalog numbers and why they matter)\n"
            "- Electives, certificates, or fast-track programs\n"
            "- Campus resources and student organizations to leverage\n"
            "- Suggested sequencing by semester (or short-term plan)\n"
            "- Skills developed or prerequisites needed"
        )
        sections.append(
            "Flag gaps where additional advising or approval may be required (e.g., prerequisites, limited seats)."
        )
        return "\n\n".join(sections)
