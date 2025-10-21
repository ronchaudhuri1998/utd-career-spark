import { parseNaturalLanguageProjects } from "./projectParser";
import type { Project, ProjectRecommendationsData } from "./projectTypes";

// Re-export types for convenience
export type { Project, ProjectRecommendationsData };

/**
 * Validates and parses project recommendations from AI-generated text
 * Supports both JSON and natural language formats
 */
export function validateProjectData(
  text: string
): ProjectRecommendationsData | null {
  if (!text || !text.trim()) {
    return null;
  }

  // First, try to parse as JSON
  const jsonResult = tryParseAsJSON(text);
  if (jsonResult) {
    return jsonResult;
  }

  // If JSON fails, try natural language parsing
  return tryParseAsNaturalLanguage(text);
}

function tryParseAsNaturalLanguage(
  text: string
): ProjectRecommendationsData | null {
  try {
    return parseNaturalLanguageProjects(text);
  } catch (error) {
    console.error("Failed to parse as natural language:", error);
    return null;
  }
}

function tryParseAsJSON(text: string): ProjectRecommendationsData | null {
  try {
    const parsed = JSON.parse(text);

    // Validate structure
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    // Ensure projects array exists
    if (!Array.isArray(parsed.projects)) {
      return null;
    }

    // Type-safe return
    return {
      projects: parsed.projects.map((project: unknown, index: number) => {
        const item = project as Record<string, unknown>;
        return {
          id: typeof item.id === "string" ? item.id : `project-${index}`,
          title:
            typeof item.title === "string" ? item.title : "Untitled Project",
          description:
            typeof item.description === "string"
              ? item.description
              : "No description provided",
          skills: Array.isArray(item.skills) ? item.skills : [],
          difficulty:
            item.difficulty === "beginner" ||
            item.difficulty === "intermediate" ||
            item.difficulty === "advanced"
              ? item.difficulty
              : "intermediate",
          estimatedTime:
            typeof item.estimatedTime === "string"
              ? item.estimatedTime
              : undefined,
          category:
            typeof item.category === "string" ? item.category : undefined,
          careerRelevance:
            typeof item.careerRelevance === "string"
              ? item.careerRelevance
              : undefined,
        };
      }),
    };
  } catch (error) {
    console.error("Failed to validate project data:", error);
    return null;
  }
}
