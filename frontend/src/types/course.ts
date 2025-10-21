import { parseNaturalLanguageCourses } from "./courseParser";

export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites?: string[];
  description?: string;
  professor?: string;
  semester?: string;
  skills?: string[];
}

export interface Semester {
  name: string;
  courses: string[];
  totalCredits: number;
}

export interface Prerequisite {
  course: string;
  requiredFor: string[];
}

export interface SkillArea {
  area: string;
  courses: string[];
  importance: "high" | "medium" | "low";
}

export interface AcademicResource {
  name: string;
  type: "tutoring" | "workshop" | "lab" | "club" | "certification" | "other";
  description?: string;
  link?: string;
}

export interface CourseInsights {
  semesters: Semester[];
  prerequisites: Prerequisite[];
  skillAreas: SkillArea[];
  resources: AcademicResource[];
}

export interface CourseData {
  courses: Course[];
  insights: CourseInsights;
}

/**
 * Validates and parses course data from AI-generated text
 * Supports both JSON and natural language formats
 */
export function validateCourseData(text: string): CourseData | null {
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

function tryParseAsNaturalLanguage(text: string): CourseData | null {
  try {
    return parseNaturalLanguageCourses(text);
  } catch (error) {
    console.error("Failed to parse as natural language:", error);
    return null;
  }
}

function tryParseAsJSON(text: string): CourseData | null {
  try {
    const parsed = JSON.parse(text);

    // Validate structure
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    // Ensure courses array exists
    if (!Array.isArray(parsed.courses)) {
      return null;
    }

    // Validate insights object
    if (!parsed.insights || typeof parsed.insights !== "object") {
      return null;
    }

    const insights = parsed.insights;
    if (
      !Array.isArray(insights.semesters) ||
      !Array.isArray(insights.prerequisites) ||
      !Array.isArray(insights.skillAreas) ||
      !Array.isArray(insights.resources)
    ) {
      return null;
    }

    // Type-safe return
    return {
      courses: parsed.courses.map((course: unknown, index: number) => {
        const item = course as Record<string, unknown>;
        return {
          id: typeof item.id === "string" ? item.id : `course-${index}`,
          courseCode:
            typeof item.courseCode === "string"
              ? item.courseCode
              : "UNKNOWN-000",
          courseName:
            typeof item.courseName === "string"
              ? item.courseName
              : "Unknown Course",
          credits:
            typeof item.credits === "number"
              ? item.credits
              : Number(item.credits) || 3,
          difficulty:
            item.difficulty === "beginner" ||
            item.difficulty === "intermediate" ||
            item.difficulty === "advanced"
              ? item.difficulty
              : "intermediate",
          prerequisites: Array.isArray(item.prerequisites)
            ? item.prerequisites
            : undefined,
          description:
            typeof item.description === "string" ? item.description : undefined,
          professor:
            typeof item.professor === "string" ? item.professor : undefined,
          semester:
            typeof item.semester === "string" ? item.semester : undefined,
          skills: Array.isArray(item.skills) ? item.skills : undefined,
        };
      }),
      insights: {
        semesters: insights.semesters.map((sem: unknown) => {
          const s = sem as Record<string, unknown>;
          return {
            name: typeof s.name === "string" ? s.name : "Unknown Semester",
            courses: Array.isArray(s.courses) ? s.courses : [],
            totalCredits:
              typeof s.totalCredits === "number"
                ? s.totalCredits
                : Number(s.totalCredits) || 0,
          };
        }),
        prerequisites: insights.prerequisites.map((prereq: unknown) => {
          const p = prereq as Record<string, unknown>;
          return {
            course: typeof p.course === "string" ? p.course : "Unknown",
            requiredFor: Array.isArray(p.requiredFor) ? p.requiredFor : [],
          };
        }),
        skillAreas: insights.skillAreas.map((skill: unknown) => {
          const s = skill as Record<string, unknown>;
          return {
            area: typeof s.area === "string" ? s.area : "Unknown",
            courses: Array.isArray(s.courses) ? s.courses : [],
            importance:
              s.importance === "high" ||
              s.importance === "medium" ||
              s.importance === "low"
                ? s.importance
                : "medium",
          };
        }),
        resources: insights.resources.map((res: unknown) => {
          const r = res as Record<string, unknown>;
          return {
            name: typeof r.name === "string" ? r.name : "Unknown Resource",
            type:
              r.type === "tutoring" ||
              r.type === "workshop" ||
              r.type === "lab" ||
              r.type === "club" ||
              r.type === "certification" ||
              r.type === "other"
                ? r.type
                : "other",
            description:
              typeof r.description === "string" ? r.description : undefined,
            link: typeof r.link === "string" ? r.link : undefined,
          };
        }),
      },
    };
  } catch (error) {
    console.error("Failed to validate course data:", error);
    return null;
  }
}
