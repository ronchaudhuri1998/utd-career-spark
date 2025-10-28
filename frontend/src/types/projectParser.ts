import type { ProjectRecommendationsData, Project } from "./projectTypes";

/**
 * Parses natural language project recommendations into structured format
 *
 * Expected format:
 *
 * === PROJECT RECOMMENDATIONS ===
 * - **Project Title**: Brief description. Skills: React, Node.js. Difficulty: intermediate
 * - **Another Project**: Description. Skills: Python, Flask. Difficulty: beginner
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

  if (projectsMatch) sections.projects = projectsMatch[1].trim();

  return sections;
}

function parseProjects(text: string): Project[] {
  const projects: Project[] = [];
  const lines = text.split("\n").filter((line) => line.trim().startsWith("-"));

  lines.forEach((line, index) => {
    // Pattern: - **Title**: Description. Skills: ... Difficulty: ...
    const match = line.match(/^-\s*\*\*([^*]+)\*\*:\s*(.+)/);
    if (match) {
      const title = match[1].trim();
      const description = match[2].trim();

      // Extract skills and difficulty from description
      const skillsMatch = description.match(/Skills:\s*([^.]+)/i);
      const difficultyMatch = description.match(/Difficulty:\s*(\w+)/i);

      const skills = skillsMatch
        ? skillsMatch[1].split(",").map((s) => s.trim())
        : [];
      const difficulty = difficultyMatch
        ? difficultyMatch[1].toLowerCase()
        : "intermediate";

      // Get actual description (remove Skills and Difficulty parts)
      let cleanDescription = description;
      if (skillsMatch) {
        cleanDescription = cleanDescription
          .replace(/Skills:\s*[^.]+\.?/, "")
          .trim();
      }
      if (difficultyMatch) {
        cleanDescription = cleanDescription
          .replace(/Difficulty:\s*\w+\.?/, "")
          .trim();
      }

      projects.push({
        id: `project-${index + 1}`,
        title,
        description: cleanDescription,
        skills,
        difficulty:
          difficulty === "beginner" ||
          difficulty === "intermediate" ||
          difficulty === "advanced"
            ? difficulty
            : "intermediate",
      });
    }
  });

  return projects;
}
