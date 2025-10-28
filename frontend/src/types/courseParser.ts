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
 * === RECOMMENDED COURSES ===
 * - CS 1337: Computer Science I
 * - CS 2336: Computer Science II
 *
 * === SKILL AREAS ===
 * - Software Development: CS 1337, CS 2336
 * - Algorithms: CS 3345, CS 4349
 */
export function parseNaturalLanguageCourses(text: string): CourseData | null {
  try {
    const sections = splitIntoSections(text);

    const courses = parseCourses(sections.courses || "");
    const skillAreas = parseSkillAreas(sections.skillAreas || "");
    const semesters = parseSemesterPlan(sections.courses || ""); // Use courses section for semester info
    const prerequisites = parsePrerequisites(sections.prerequisites || "");
    const resources = parseAcademicResources(sections.resources || "");

    // Validate we have at least some data
    if (courses.length === 0 && skillAreas.length === 0) {
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
    /===\s*RECOMMENDED COURSES\s*===([\s\S]*?)(?====|$)/i
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
  if (prerequisitesMatch) sections.prerequisites = prerequisitesMatch[1].trim();
  if (skillAreasMatch) sections.skillAreas = skillAreasMatch[1].trim();
  if (resourcesMatch) sections.resources = resourcesMatch[1].trim();

  return sections;
}

function parseCourses(text: string): Course[] {
  const courses: Course[] = [];

  // Parse semester-organized format
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  let currentSemester = "";
  let courseIndex = 0;

  lines.forEach((line) => {
    // Check for semester header: "Fall 2025:" or "Spring 2026:"
    const semesterMatch = line.match(/^(Fall|Spring)\s+(\d{4}):$/);
    if (semesterMatch) {
      currentSemester = `${semesterMatch[1]} ${semesterMatch[2]}`;
      return;
    }

    // Check for course entry: "1. CS 3345. Skills: ..."
    const courseMatch = line.match(/^\d+\.\s+(CS\s+\d+)\.\s+Skills:\s*(.+)$/);
    if (courseMatch) {
      const courseCode = courseMatch[1];
      const skillsText = courseMatch[2];
      const skills = skillsText.split(",").map((s) => s.trim());

      courses.push({
        id: `course-${++courseIndex}`,
        courseCode: courseCode,
        courseName: "", // Will be fetched from Nebula API
        credits: 0, // Will be fetched from Nebula API
        difficulty: "intermediate", // Default, will be updated from Nebula API
        description: "", // Will be fetched from Nebula API
        prerequisites: [], // Will be fetched from Nebula API
        semester: currentSemester,
        skills: skills,
      });
    }
  });

  return courses;
}

function parseSkillAreas(text: string): SkillArea[] {
  const skillAreas: SkillArea[] = [];
  const lines = text.split("\n").filter((line) => line.trim().startsWith("-"));

  for (const line of lines) {
    // Pattern: - Area Name: course1, course2
    const match = line.match(/^-\s*([^:]+):\s*(.+)/);
    if (match) {
      const area = match[1].trim();
      const coursesText = match[2].trim();
      const courses = coursesText
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      skillAreas.push({
        area,
        courses,
        importance: "medium", // Default
      });
    }
  }

  return skillAreas;
}

function parseSemesterPlan(text: string): Semester[] {
  const semesters: Semester[] = [];
  const lines = text.split("\n").filter((line) => line.trim());

  let currentSemester: Partial<Semester> | null = null;

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    // Check for semester header pattern: "Fall 2025:" or "Spring 2026:"
    const semesterMatch = trimmedLine.match(/^(Fall|Spring)\s+(\d{4}):$/);
    if (semesterMatch) {
      // Save previous semester if exists
      if (currentSemester && currentSemester.name && currentSemester.courses) {
        semesters.push({
          name: currentSemester.name,
          courses: currentSemester.courses,
          totalCredits: currentSemester.totalCredits || 0,
        });
      }

      // Start new semester
      currentSemester = {
        name: `${semesterMatch[1]} ${semesterMatch[2]}`,
        courses: [],
        totalCredits: 0, // Will be calculated from course credits
      };
    } else if (
      trimmedLine.match(/^\d+\.\s+CS\s+\d+\.\s+Skills:/) &&
      currentSemester
    ) {
      // Parse course entry: "1. CS 3345. Skills: ..."
      const courseMatch = trimmedLine.match(/^\d+\.\s+(CS\s+\d+)\.\s+Skills:/);
      if (courseMatch) {
        const courseCode = courseMatch[1];
        currentSemester.courses = [
          ...(currentSemester.courses || []),
          courseCode,
        ];
      }
    }
  });

  // Add the last semester
  if (currentSemester && currentSemester.name && currentSemester.courses) {
    semesters.push({
      name: currentSemester.name,
      courses: currentSemester.courses,
      totalCredits: currentSemester.totalCredits || 0,
    });
  }

  return semesters;
}

function parsePrerequisites(text: string): Prerequisite[] {
  const prerequisites: Prerequisite[] = [];
  const lines = text.split("\n").filter((line) => line.trim());

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    // Pattern: "CS 2336 → Required for: CS 3345, CS 4355"
    const prereqMatch = trimmedLine.match(
      /^(CS\s+\d+)\s*→\s*Required for:\s*(.+)/
    );
    if (prereqMatch) {
      const course = prereqMatch[1].trim();
      const requiredForText = prereqMatch[2].trim();
      const requiredFor = requiredForText
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      prerequisites.push({
        course,
        requiredFor,
      });
    }
  });

  return prerequisites;
}

function parseAcademicResources(text: string): AcademicResource[] {
  const resources: AcademicResource[] = [];
  const lines = text.split("\n").filter((line) => line.trim().startsWith("-"));

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    // Pattern: "- Resource Name (type): Description"
    const resourceMatch = trimmedLine.match(/^-\s*(.+?)\s+\(([^)]+)\):\s*(.+)/);
    if (resourceMatch) {
      const name = resourceMatch[1].trim();
      const type = resourceMatch[2].trim().toLowerCase();
      const description = resourceMatch[3].trim();

      // Validate type
      const validTypes = [
        "tutoring",
        "workshop",
        "lab",
        "club",
        "certification",
        "other",
      ];
      const resourceType = validTypes.includes(type)
        ? (type as AcademicResource["type"])
        : "other";

      resources.push({
        name,
        type: resourceType,
        description,
      });
    }
  });

  return resources;
}
