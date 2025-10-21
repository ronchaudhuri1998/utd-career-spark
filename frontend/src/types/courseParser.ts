import {
  CourseData,
  Course,
  Semester,
  Prerequisite,
  SkillArea,
  AcademicResource,
} from "./course";

/**
 * Parses natural language course data into structured format
 *
 * Expected format:
 *
 * === COURSE CATALOG ===
 *
 * Course #1:
 * Code: CS 1337
 * Name: Computer Science I
 * Credits: 3
 * Difficulty: beginner
 * Prerequisites: None
 * Semester: Fall 2025
 * Professor: Dr. Smith
 * Skills: Java, Programming Fundamentals, Problem Solving
 * Description: Introduction to computer science...
 *
 * === SEMESTER PLAN ===
 * - Fall 2025 (15 credits): CS 1337, MATH 2417, COMM 1311, ECS 1100
 * - Spring 2026 (15 credits): CS 2336, CS 2305, MATH 2419
 *
 * === PREREQUISITES ===
 * - CS 1337 (required for: CS 2336, CS 2305)
 * - MATH 2417 (required for: MATH 2419, CS 3345)
 *
 * === SKILL AREAS ===
 * - Software Development (high importance): CS 1337, CS 2336, CS 3345
 * - Data Structures (medium importance): CS 2305, CS 3345
 *
 * === ACADEMIC RESOURCES ===
 * [tutoring] CS Tutoring Center
 * Located in ECSS. Free tutoring for all CS courses.
 *
 * [workshop] Career Preparation Workshop
 * Monthly workshops on resume building and interview prep.
 */
export function parseNaturalLanguageCourses(text: string): CourseData | null {
  try {
    const sections = splitIntoSections(text);

    const courses = parseCourses(sections.courses || "");
    const semesters = parseSemesters(sections.semesters || "");
    const prerequisites = parsePrerequisites(sections.prerequisites || "");
    const skillAreas = parseSkillAreas(sections.skillAreas || "");
    const resources = parseResources(sections.resources || "");

    // Validate we have at least some data
    if (
      courses.length === 0 &&
      semesters.length === 0 &&
      skillAreas.length === 0
    ) {
      return null;
    }

    return {
      courses,
      insights: {
        semesters,
        prerequisites,
        skillAreas,
        resources,
      },
    };
  } catch (error) {
    console.error("Error parsing natural language course data:", error);
    return null;
  }
}

function splitIntoSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};

  // Split by section headers
  const coursesMatch = text.match(
    /===\s*COURSE CATALOG\s*===([\s\S]*?)(?====|$)/i
  );
  const semestersMatch = text.match(
    /===\s*SEMESTER PLAN\s*===([\s\S]*?)(?====|$)/i
  );
  const prerequisitesMatch = text.match(
    /===\s*PREREQUISITES\s*===([\s\S]*?)(?====|$)/i
  );
  const skillAreasMatch = text.match(
    /===\s*SKILL AREAS\s*===([\s\S]*?)(?====|$)/i
  );
  const resourcesMatch = text.match(
    /===\s*ACADEMIC RESOURCES\s*===([\s\S]*?)(?====|$)/i
  );

  if (coursesMatch) sections.courses = coursesMatch[1].trim();
  if (semestersMatch) sections.semesters = semestersMatch[1].trim();
  if (prerequisitesMatch) sections.prerequisites = prerequisitesMatch[1].trim();
  if (skillAreasMatch) sections.skillAreas = skillAreasMatch[1].trim();
  if (resourcesMatch) sections.resources = resourcesMatch[1].trim();

  return sections;
}

function parseCourses(text: string): Course[] {
  const courses: Course[] = [];

  // Split by "Course #N:" pattern
  const courseBlocks = text.split(/Course\s+#\d+:/i).filter(Boolean);

  courseBlocks.forEach((block, index) => {
    const lines = block.trim().split("\n");
    const course: Partial<Course> = {
      id: `course-${index + 1}`,
      credits: 3,
      difficulty: "intermediate",
      skills: [],
    };

    let description = "";
    let inDescription = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("Code:")) {
        course.courseCode = trimmed.replace(/^Code:\s*/i, "").trim();
        inDescription = false;
      } else if (trimmed.startsWith("Name:")) {
        course.courseName = trimmed.replace(/^Name:\s*/i, "").trim();
        inDescription = false;
      } else if (trimmed.startsWith("Credits:")) {
        const creditsStr = trimmed.replace(/^Credits:\s*/i, "").trim();
        course.credits = parseInt(creditsStr) || 3;
        inDescription = false;
      } else if (trimmed.startsWith("Difficulty:")) {
        const diff = trimmed
          .replace(/^Difficulty:\s*/i, "")
          .trim()
          .toLowerCase();
        if (
          diff === "beginner" ||
          diff === "intermediate" ||
          diff === "advanced"
        ) {
          course.difficulty = diff;
        }
        inDescription = false;
      } else if (trimmed.startsWith("Prerequisites:")) {
        const prereqText = trimmed.replace(/^Prerequisites:\s*/i, "").trim();
        if (prereqText && prereqText.toLowerCase() !== "none") {
          course.prerequisites = prereqText
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
        }
        inDescription = false;
      } else if (trimmed.startsWith("Semester:")) {
        course.semester = trimmed.replace(/^Semester:\s*/i, "").trim();
        inDescription = false;
      } else if (trimmed.startsWith("Professor:")) {
        course.professor = trimmed.replace(/^Professor:\s*/i, "").trim();
        inDescription = false;
      } else if (trimmed.startsWith("Skills:")) {
        const skillsText = trimmed.replace(/^Skills:\s*/i, "").trim();
        course.skills = skillsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        inDescription = false;
      } else if (trimmed.startsWith("Description:")) {
        description = trimmed.replace(/^Description:\s*/i, "").trim();
        inDescription = true;
      } else if (inDescription) {
        description += " " + trimmed;
      }
    }

    if (description) {
      course.description = description.trim();
    }

    // Only add if we have at least code and name
    if (course.courseCode && course.courseName) {
      courses.push({
        id: course.id!,
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits!,
        difficulty: course.difficulty!,
        prerequisites: course.prerequisites,
        description: course.description,
        professor: course.professor,
        semester: course.semester,
        skills: course.skills,
      });
    }
  });

  return courses;
}

function parseSemesters(text: string): Semester[] {
  const semesters: Semester[] = [];
  const lines = text.split("\n").filter((line) => line.trim().startsWith("-"));

  for (const line of lines) {
    // Pattern: - Semester Name (credits): course1, course2, course3
    const match = line.match(/^-\s*([^(]+)\s*\((\d+)\s*credits?\):\s*(.+)/i);
    if (match) {
      const name = match[1].trim();
      const credits = parseInt(match[2]);
      const coursesText = match[3].trim();
      const courses = coursesText
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      semesters.push({
        name,
        totalCredits: credits,
        courses,
      });
    }
  }

  return semesters;
}

function parsePrerequisites(text: string): Prerequisite[] {
  const prerequisites: Prerequisite[] = [];
  const lines = text.split("\n").filter((line) => line.trim().startsWith("-"));

  for (const line of lines) {
    // Pattern: - Course Code (required for: course1, course2)
    const match = line.match(/^-\s*([^(]+)\s*\(required for:\s*([^)]+)\)/i);
    if (match) {
      const course = match[1].trim();
      const requiredForText = match[2].trim();
      const requiredFor = requiredForText
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      prerequisites.push({
        course,
        requiredFor,
      });
    }
  }

  return prerequisites;
}

function parseSkillAreas(text: string): SkillArea[] {
  const skillAreas: SkillArea[] = [];
  const lines = text.split("\n").filter((line) => line.trim().startsWith("-"));

  for (const line of lines) {
    // Pattern: - Area Name (importance level): course1, course2
    const match = line.match(
      /^-\s*([^(]+)\s*\((high|medium|low)\s*importance\):\s*(.+)/i
    );
    if (match) {
      const area = match[1].trim();
      const importance = match[2].toLowerCase() as "high" | "medium" | "low";
      const coursesText = match[3].trim();
      const courses = coursesText
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      skillAreas.push({
        area,
        importance,
        courses,
      });
    }
  }

  return skillAreas;
}

function parseResources(text: string): AcademicResource[] {
  const resources: AcademicResource[] = [];

  // Split by resource markers
  const resourceBlocks = text
    .split(/\[(?:tutoring|workshop|lab|club|certification|other)\]/i)
    .filter(Boolean);

  // Get the types
  const typeMatches = text.match(
    /\[(tutoring|workshop|lab|club|certification|other)\]/gi
  );

  if (!typeMatches) return resources;

  typeMatches.forEach((typeMatch, index) => {
    if (index >= resourceBlocks.length) return;

    const type = typeMatch
      .replace(/[\[\]]/g, "")
      .toLowerCase() as AcademicResource["type"];
    const content = resourceBlocks[index].trim();

    const lines = content.split("\n").filter(Boolean);
    if (lines.length > 0) {
      const name = lines[0].trim();
      const description = lines.slice(1).join(" ").trim();

      // Try to extract link if present
      const linkMatch = description.match(/(https?:\/\/[^\s]+)/);
      const link = linkMatch ? linkMatch[1] : undefined;

      resources.push({
        name,
        type,
        description: description || undefined,
        link,
      });
    }
  });

  return resources;
}
