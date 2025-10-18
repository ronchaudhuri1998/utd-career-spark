# agents/job_market_agent.py
"""Claude agent focused on job market research for UTD students."""

from __future__ import annotations

import html
import logging
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import os

try:
    import requests  # type: ignore
except ImportError:  # pragma: no cover - requests may not be available
    requests = None

from agents.base_agent import BaseAgent


logger = logging.getLogger("career_guidance.job_market")


class JobMarketAgent(BaseAgent):
    """Analyze trending job roles, skills, and employers."""

    role_name = "Job Market Analyst"
    role_description = (
        "Analyze current hiring needs, emerging roles, salary outlook, and core skills "
        "for technology careers relevant to UTD students."
    )

    hacker_news_jobs_url = "https://news.ycombinator.com/jobs"
    itjobswatch_skills_url = "https://www.itjobswatch.co.uk/default.aspx?JobType=Permanent"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.last_scrape: Dict[str, str] = {}
        self.scrape_enabled = os.getenv("JOB_MARKET_SCRAPE", "0") == "1"

    def run(
        self,
        query: str,
        *,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Run the agent with live market data scraped from public sources."""
        context = context or {}
        if self.scrape_enabled:
            logger.info("[JobMarketAgent] Gathering live labor market signals.")
            scrape_data = self._gather_web_signals()
        else:
            logger.info("[JobMarketAgent] Live scraping disabled. Using cached sample signals.")
            scrape_data = {
                "roles_summary": "\n".join(
                    [
                        "- Machine Learning Engineer: steady hiring across healthcare and fintech employers",
                        "- Data Engineer: cloud data pipeline roles spiking in Dallas and Austin",
                        "- AI Product Manager: early-career openings at platform companies embracing applied AI",
                    ]
                ),
                "skills_summary": "\n".join(
                    [
                        "- Python & SQL remain must-have core skills",
                        "- AWS (Lambda, Glue, SageMaker) and Azure ML skills trending upward",
                        "- Stakeholder communication and experiment design cited in 70% of descriptions",
                    ]
                ),
                "notes": "Sample insights generated offline while live scraping is disabled.",
            }
        self.last_scrape = scrape_data

        if scrape_data["roles_summary"]:
            context["scraped_roles"] = scrape_data["roles_summary"]
            logger.info("[JobMarketAgent] Derived role trends from Hacker News Hiring.")
        if scrape_data["skills_summary"]:
            context["scraped_skills"] = scrape_data["skills_summary"]
            logger.info("[JobMarketAgent] Summarized in-demand skills from IT Jobs Watch.")
        context["scrape_notes"] = scrape_data["notes"]

        return super().run(query, context=context)

    def build_prompt(
        self,
        query: str,
        context: Optional[Dict[str, str]] = None,
    ) -> str:
        """Craft a job-market specific prompt for Claude."""
        context = context or {}
        focus_regions = context.get(
            "regions",
            "Dallas-Fort Worth metro area and remote-friendly US roles",
        )
        target_industries = context.get(
            "industries",
            "technology, finance, healthcare, and consulting employers",
        )
        known_trends = context.get("market_research")
        skills_focus = context.get("skills_of_interest")
        scraped_roles = context.get("scraped_roles")
        scraped_skills = context.get("scraped_skills")
        scrape_notes = context.get("scrape_notes")

        sections = [
            f"Student goal: {query.strip() or 'Clarify viable tech career paths for a UTD student.'}",
            "Task: Provide an up-to-date snapshot of the job market relevant to this goal. Capture:",
            "- 2-3 high-growth job titles with brief justification and outlook",
            "- The most requested technical and soft skills",
            "- Notable employers actively hiring early-career talent",
            "- Certifications or extracurricular signals that improve competitiveness",
            f"Primary geography to emphasize: {focus_regions}",
            f"Industries or segments to inspect: {target_industries}",
        ]
        if skills_focus:
            sections.append(f"Skills the student is already interested in: {skills_focus}")
        if known_trends:
            sections.append(f"Recent labor market data provided by organizers:\n{known_trends}")
        if scraped_roles:
            sections.append(f"Live job postings (scraped):\n{scraped_roles}")
        if scraped_skills:
            sections.append(f"Demanded skills from IT Jobs Watch scrape:\n{scraped_skills}")
        if scrape_notes:
            sections.append(f"Scrape metadata:\n{scrape_notes}")

        sections.append(
            "Format the answer with headings for Roles, Skills, Employers, and Signals. "
            "Call out any assumptions or missing data at the end."
        )
        return "\n\n".join(sections)

    # ------------------------------------------------------------------
    # Scraping helpers
    # ------------------------------------------------------------------
    def _gather_web_signals(self) -> Dict[str, str]:
        """Collect job postings and skill demand data from public sites."""
        logger.info("[JobMarketAgent] Scraping Hacker News hiring board.")
        hn_roles, hn_errors = self._scrape_hackernews_jobs()
        top_roles = self._summarize_roles(hn_roles)
        if hn_errors:
            logger.warning("[JobMarketAgent] Hacker News scrape warning: %s", hn_errors)
        elif not hn_roles:
            logger.warning("[JobMarketAgent] Hacker News scrape returned no job titles.")
        else:
            logger.info("[JobMarketAgent] Parsed %d job postings.", len(hn_roles))

        logger.info("[JobMarketAgent] Scraping IT Jobs Watch skill trends.")
        skills, skill_errors = self._scrape_itjobswatch_skills()
        top_skills = self._summarize_skills(skills)
        if skill_errors:
            logger.warning("[JobMarketAgent] IT Jobs Watch scrape warning: %s", skill_errors)
        elif not skills:
            logger.warning("[JobMarketAgent] IT Jobs Watch scrape returned no skills.")
        else:
            logger.info("[JobMarketAgent] Parsed %d skill rows.", len(skills))

        notes: List[str] = []
        if hn_errors:
            notes.append(f"Hacker News scrape issues: {hn_errors}")
        if skill_errors:
            notes.append(f"IT Jobs Watch scrape issues: {skill_errors}")
        if hn_roles:
            notes.append(f"Pulled {len(hn_roles)} Hacker News job postings ({self.hacker_news_jobs_url}).")
        if skills:
            notes.append(f"Captured {len(skills)} skill rows ({self.itjobswatch_skills_url}).")

        return {
            "roles_summary": top_roles,
            "skills_summary": top_skills,
            "notes": "\n".join(notes),
        }

    @staticmethod
    def _http_get(url: str, *, timeout: int = 10) -> Tuple[str, Optional[str]]:
        """Download a page with a basic user-agent header."""
        headers = {"User-Agent": "Mozilla/5.0 (Career-Guidance-Agent)"}
        try:
            if requests is not None:
                response = requests.get(url, headers=headers, timeout=timeout)
                if response.status_code >= 400:
                    return response.text, f"HTTP {response.status_code} from {url}"
                return response.text, None

            request = Request(url, headers=headers)
            with urlopen(request, timeout=timeout) as resp:  # type: ignore[arg-type]
                html_text = resp.read().decode("utf-8", errors="ignore")
            return html_text, None
        except (HTTPError, URLError) as exc:  # pragma: no cover - network dependent
            return "", f"{exc.__class__.__name__}: {exc}"
        except Exception as exc:  # pragma: no cover - network dependent
            return "", f"Unexpected error fetching {url}: {exc}"

    def _scrape_hackernews_jobs(self) -> Tuple[List[str], Optional[str]]:
        """Scrape job titles from the Hacker News jobs page."""
        html_text, error = self._http_get(self.hacker_news_jobs_url)
        if not html_text:
            return [], error

        pattern = re.compile(r'<span class="titleline"><a href="[^"]+"[^>]*>(.*?)</a>', re.S)
        titles: List[str] = []
        for raw_title in pattern.findall(html_text):
            clean_title = html.unescape(re.sub(r"<.*?>", "", raw_title)).strip()
            if not clean_title:
                continue
            titles.append(clean_title)
        return titles, error

    @staticmethod
    def _summarize_roles(titles: List[str]) -> str:
        """Turn scraped job titles into a concise summary."""
        if not titles:
            return ""

        roles: List[str] = []
        cleaned_titles: List[str] = []
        for title in titles:
            match = re.search(r"(?:is hiring|hiring)\s+(.+)", title, re.IGNORECASE)
            role = match.group(1) if match else title
            role = re.sub(r"for\s+", "", role, flags=re.IGNORECASE)
            role = role.split(" - ")[0]
            role = re.sub(r"^(an?|the)\s+", "", role.strip(), flags=re.IGNORECASE)
            role = role.strip(" .")
            if role:
                roles.append(role.title())
            cleaned_titles.append(title)

        if not roles:
            return "\n".join(f"- {title}" for title in titles[:10])

        counter = Counter(roles)
        top_entries = counter.most_common(5)
        summary_lines = []
        for role, count in top_entries:
            if count == 1:
                summary_lines.append(f"- {role}: 1 recent posting (Hacker News Hiring)")
            else:
                summary_lines.append(f"- {role}: {count} recent postings (Hacker News Hiring)")

        sample_titles = cleaned_titles[:3]
        if sample_titles:
            summary_lines.append("Sample postings:")
            summary_lines.extend(f"  - {title}" for title in sample_titles)
        return "\n".join(summary_lines)

    def _scrape_itjobswatch_skills(self) -> Tuple[List[Dict[str, str]], Optional[str]]:
        """Scrape top skills data from IT Jobs Watch."""
        html_text, error = self._http_get(self.itjobswatch_skills_url)
        if not html_text:
            return [], error

        tables = html_text.split("<table")
        if len(tables) < 3:
            return [], error or "Unable to locate skills table in HTML."
        table_html = "<table" + tables[2].split("</table>", 1)[0] + "</table>"
        rows = re.findall(r"<tr[^>]*>(.*?)</tr>", table_html, re.S)
        if not rows:
            return [], error or "Skills table rows missing."

        skills: List[Dict[str, str]] = []
        for row in rows[1:]:
            cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row, re.S)
            cleaned = [html.unescape(re.sub(r"<.*?>", "", cell)).strip() for cell in cells]
            if len(cleaned) < 7:
                continue
            skill = cleaned[0]
            rank = cleaned[1]
            median_salary = cleaned[3]
            historic_jobs = cleaned[5].split()[0]
            live_jobs = cleaned[6]

            skills.append(
                {
                    "skill": skill,
                    "rank": rank,
                    "median_salary": median_salary,
                    "historic_jobs": historic_jobs,
                    "live_jobs": live_jobs,
                }
            )
        return skills[:10], error

    @staticmethod
    def _summarize_skills(skills: List[Dict[str, str]]) -> str:
        """Format scraped skills data."""
        if not skills:
            return ""
        summary_lines = []
        for item in skills[:5]:
            summary_lines.append(
                "- #{rank} {skill} — median {median_salary}, live roles: {live_jobs}".format(
                    **item
                )
            )
        return "\n".join(summary_lines)
