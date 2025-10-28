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

  // Companies hiring
  if (parsedData.insights.topEmployers.length > 0) {
    stats.push({
      label: "Companies Hiring",
      value: parsedData.insights.topEmployers.length,
      icon: "Briefcase",
    });
  }

  // Top skills count
  if (parsedData.insights.skills.length > 0) {
    stats.push({
      label: "In-Demand Skills",
      value: parsedData.insights.skills.length,
      icon: "Zap",
    });
  }

  // Market trends count
  if (parsedData.insights.marketTrends.length > 0) {
    stats.push({
      label: "Market Insights",
      value: parsedData.insights.marketTrends.length,
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

  // Skill areas
  if (parsedData.insights.skillAreas.length > 0) {
    stats.push({
      label: "Skill Areas",
      value: parsedData.insights.skillAreas.length,
      icon: "GraduationCap",
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

  // Unique skills count
  const allSkills = new Set(
    parsedData.projects.flatMap((p) => p.skills).filter(Boolean)
  );
  if (allSkills.size > 0) {
    stats.push({
      label: "Unique Skills",
      value: allSkills.size,
      icon: "Zap",
    });
  }

  return stats;
}
