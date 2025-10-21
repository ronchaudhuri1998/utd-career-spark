import type { ProjectRecommendationsData, Project } from "./projectTypes";

/**
 * Parses natural language project recommendations into structured format
 *
 * Expected format:
 *
 * === PROJECT RECOMMENDATIONS ===
 *
 * Project #1:
 * Title: Build a Full-Stack Task Manager
 * Description: Create a web application that allows users to manage tasks...
 * Skills: React, Node.js, MongoDB, Express
 * Difficulty: Intermediate
 * Estimated Time: 2-3 weeks
 * Category: Full-Stack Development
 * Career Relevance: Demonstrates CRUD operations and API design...
 *
 * Project #2:
 * Title: Machine Learning Price Predictor
 * Description: Develop a model to predict housing prices...
 * Skills: Python, Pandas, Scikit-learn
 * Difficulty: Advanced
 * Estimated Time: 3-4 weeks
 * Category: Data Science
 *
 */
export function parseNaturalLanguageProjects(
  text: string
): ProjectRecommendationsData | null {
  try {
    const sections = splitIntoSections(text);

    const projects = parseProjects(sections.projects || "");

    // Validate we have at least some data
    if (projects.length === 0) {
      return null;
    }

    return {
      projects,
    };
  } catch (error) {
    console.error("Error parsing natural language project data:", error);
    return null;
  }
}

function splitIntoSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};

  // Split by section headers
  const projectsMatch = text.match(
    /===\s*PROJECT(?:\s+RECOMMENDATIONS)?\s*===([\s\S]*?)(?====|$)/i
  );
  const summaryMatch = text.match(/===\s*SUMMARY\s*===([\s\S]*?)(?====|$)/i);

  if (projectsMatch) sections.projects = projectsMatch[1].trim();
  if (summaryMatch) sections.summary = summaryMatch[1].trim();

  return sections;
}

function parseProjects(text: string): Project[] {
  const projects: Project[] = [];

  // Split by "Project #N:" pattern
  const projectBlocks = text.split(/Project\s+#\d+:/i).filter(Boolean);

  projectBlocks.forEach((block, index) => {
    const lines = block.trim().split("\n");
    const project: Partial<Project> = {
      id: `project-${index + 1}`,
      skills: [],
    };

    let description = "";
    let careerRelevance = "";
    let inDescription = false;
    let inCareerRelevance = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("Title:")) {
        project.title = trimmed.replace(/^Title:\s*/i, "").trim();
        inDescription = false;
        inCareerRelevance = false;
      } else if (trimmed.startsWith("Description:")) {
        description = trimmed.replace(/^Description:\s*/i, "").trim();
        inDescription = true;
        inCareerRelevance = false;
      } else if (trimmed.startsWith("Skills:")) {
        const skillsText = trimmed.replace(/^Skills:\s*/i, "").trim();
        project.skills = skillsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        inDescription = false;
        inCareerRelevance = false;
      } else if (trimmed.startsWith("Difficulty:")) {
        const difficulty = trimmed
          .replace(/^Difficulty:\s*/i, "")
          .trim()
          .toLowerCase();
        if (
          difficulty === "beginner" ||
          difficulty === "intermediate" ||
          difficulty === "advanced"
        ) {
          project.difficulty = difficulty;
        }
        inDescription = false;
        inCareerRelevance = false;
      } else if (trimmed.startsWith("Estimated Time:")) {
        project.estimatedTime = trimmed
          .replace(/^Estimated Time:\s*/i, "")
          .trim();
        inDescription = false;
        inCareerRelevance = false;
      } else if (trimmed.startsWith("Category:")) {
        project.category = trimmed.replace(/^Category:\s*/i, "").trim();
        inDescription = false;
        inCareerRelevance = false;
      } else if (trimmed.startsWith("Career Relevance:")) {
        careerRelevance = trimmed.replace(/^Career Relevance:\s*/i, "").trim();
        inDescription = false;
        inCareerRelevance = true;
      } else if (inDescription) {
        description += " " + trimmed;
      } else if (inCareerRelevance) {
        careerRelevance += " " + trimmed;
      }
    }

    if (description) {
      project.description = description.trim();
    }

    if (careerRelevance) {
      project.careerRelevance = careerRelevance.trim();
    }

    // Only add if we have at least title and description
    if (project.title && project.description) {
      projects.push({
        id: project.id!,
        title: project.title,
        description: project.description,
        skills: project.skills || [],
        difficulty: project.difficulty || "intermediate",
        estimatedTime: project.estimatedTime,
        category: project.category,
        careerRelevance: project.careerRelevance,
      });
    }
  });

  return projects;
}
