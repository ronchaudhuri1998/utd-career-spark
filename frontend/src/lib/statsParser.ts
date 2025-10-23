import { validateJobMarketData, type JobMarketData } from "@/types/jobMarket";
import { validateCourseData, type CourseData } from "@/types/course";
import {
  validateProjectData,
  type ProjectRecommendationsData,
} from "@/types/project";

export interface StatItem {
  label: string;
  value: string | number;
  icon?: string;
  trend?: "up" | "down" | "neutral";
}

/**
 * Extract statistics from job market data
 */
export function extractJobMarketStats(jobMarketText: string): StatItem[] {
  const parsedData = validateJobMarketData(jobMarketText);
  if (!parsedData) {
    return [];
  }

  const stats: StatItem[] = [];

  // Total jobs
  if (parsedData.listings.length > 0) {
    stats.push({
      label: "Recommended Jobs",
      value: parsedData.listings.length,
      icon: "Briefcase",
    });
  }

  // Average salary (extract from salary ranges)
  const salaries = parsedData.listings
    .map((job) => job.salary)
    .filter(Boolean)
    .map((salary) => {
      // Extract numbers from salary strings like "$85,000 - $120,000"
      const numbers = salary?.match(/\$?([0-9,]+)/g);
      if (numbers && numbers.length >= 2) {
        const min = parseInt(numbers[0].replace(/[$,]/g, ""));
        const max = parseInt(numbers[1].replace(/[$,]/g, ""));
        return (min + max) / 2;
      }
      return null;
    })
    .filter((salary): salary is number => salary !== null);

  if (salaries.length > 0) {
    const avgSalary = Math.round(
      salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length
    );
    stats.push({
      label: "Avg Salary",
      value: `$${(avgSalary / 1000).toFixed(0)}K`,
      icon: "DollarSign",
    });
  }

  // Top skills count
  if (parsedData.insights.skills.length > 0) {
    stats.push({
      label: "Top Skills",
      value: parsedData.insights.skills.length,
      icon: "Zap",
    });
  }

  // Hot roles count
  if (parsedData.insights.hotRoles.length > 0) {
    stats.push({
      label: "Hot Roles",
      value: parsedData.insights.hotRoles.length,
      icon: "TrendingUp",
    });
  }

  return stats;
}

/**
 * Extract statistics from course data
 */
export function extractCourseStats(courseText: string): StatItem[] {
  const parsedData = validateCourseData(courseText);
  if (!parsedData) {
    return [];
  }

  const stats: StatItem[] = [];

  // Total courses
  if (parsedData.courses.length > 0) {
    stats.push({
      label: "Courses",
      value: parsedData.courses.length,
      icon: "BookOpen",
    });
  }

  // Total credits
  const totalCredits = parsedData.courses.reduce(
    (sum, course) => sum + course.credits,
    0
  );
  if (totalCredits > 0) {
    stats.push({
      label: "Credits",
      value: totalCredits,
      icon: "GraduationCap",
    });
  }

  // Semesters planned
  if (parsedData.insights.semesters.length > 0) {
    stats.push({
      label: "Semesters",
      value: parsedData.insights.semesters.length,
      icon: "Calendar",
    });
  }

  // Resources available
  if (parsedData.insights.resources.length > 0) {
    stats.push({
      label: "Resources",
      value: parsedData.insights.resources.length,
      icon: "Users",
    });
  }

  return stats;
}

/**
 * Extract statistics from project data
 */
export function extractProjectStats(projectText: string): StatItem[] {
  const parsedData = validateProjectData(projectText);
  if (!parsedData) {
    return [];
  }

  const stats: StatItem[] = [];

  // Total projects
  if (parsedData.projects.length > 0) {
    stats.push({
      label: "Projects",
      value: parsedData.projects.length,
      icon: "Code",
    });
  }

  // Difficulty breakdown
  const difficultyCounts = parsedData.projects.reduce((acc, project) => {
    acc[project.difficulty] = (acc[project.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const advancedCount = difficultyCounts.advanced || 0;
  if (advancedCount > 0) {
    stats.push({
      label: "Advanced",
      value: advancedCount,
      icon: "Star",
    });
  }

  // Average time estimate (extract weeks from time strings)
  const timeEstimates = parsedData.projects
    .map((project) => project.estimatedTime)
    .filter(Boolean)
    .map((time) => {
      // Extract numbers from strings like "3-4 weeks", "2-3 weeks"
      const match = time?.match(/(\d+)-?(\d+)?\s*weeks?/i);
      if (match) {
        const min = parseInt(match[1]);
        const max = match[2] ? parseInt(match[2]) : min;
        return (min + max) / 2;
      }
      return null;
    })
    .filter((time): time is number => time !== null);

  if (timeEstimates.length > 0) {
    const avgTime = Math.round(
      timeEstimates.reduce((sum, time) => sum + time, 0) / timeEstimates.length
    );
    stats.push({
      label: "Avg Time",
      value: `${avgTime} weeks`,
      icon: "Clock",
    });
  }

  // Categories count
  const categories = new Set(
    parsedData.projects.map((p) => p.category).filter(Boolean)
  );
  if (categories.size > 0) {
    stats.push({
      label: "Categories",
      value: categories.size,
      icon: "Layers",
    });
  }

  return stats;
}
