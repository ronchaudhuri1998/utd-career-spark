import {
  JobMarketData,
  JobListing,
  HotRole,
  Skill,
  TopEmployer,
  MarketTrend,
} from "./jobMarket";

/**
 * Parses natural language job market data into structured format
 *
 * Expected format:
 *
 * === TOP COMPANIES HIRING ===
 * - Ford Motor Company
 * - Bluesky
 *
 * === IN-DEMAND SKILLS ===
 * - AI (trending up)
 * - Python (stable)
 *
 * === MARKET INSIGHTS ===
 * [2-3 sentences summary]
 */
export function parseNaturalLanguageJobMarket(
  text: string
): JobMarketData | null {
  try {
    const sections = splitIntoSections(text);

    const topEmployers = parseTopEmployers(sections.companies || "");
    const skills = parseSkills(sections.skills || "");
    const marketTrends = parseMarketInsights(sections.insights || "");

    // For compatibility, create minimal job listings from companies
    const listings = topEmployers.map((employer, idx) => ({
      id: `listing-${idx + 1}`,
      title: "Software Engineer",
      company: employer.name,
      location: employer.location || "Location TBD",
      type: "Full-time",
      skills: [],
    }));

    // Create hot roles from companies
    const hotRoles: HotRole[] = topEmployers.map((emp) => ({
      role: "Software Engineer",
      count: emp.openings || 1,
      trend: "stable" as const,
    }));

    // Validate we have at least some data
    if (topEmployers.length === 0 && skills.length === 0) {
      return null;
    }

    return {
      listings,
      insights: {
        hotRoles,
        skills,
        topEmployers,
        marketTrends,
      },
    };
  } catch (error) {
    console.error("Error parsing natural language job market data:", error);
    return null;
  }
}

function splitIntoSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};

  // Split by section headers
  const companiesMatch = text.match(
    /===\s*TOP COMPANIES HIRING\s*===([\s\S]*?)(?====|$)/i
  );
  const skillsMatch = text.match(
    /===\s*IN-DEMAND SKILLS\s*===([\s\S]*?)(?====|$)/i
  );
  const insightsMatch = text.match(
    /===\s*MARKET INSIGHTS\s*===([\s\S]*?)(?====|$)/i
  );

  if (companiesMatch) sections.companies = companiesMatch[1].trim();
  if (skillsMatch) sections.skills = skillsMatch[1].trim();
  if (insightsMatch) sections.insights = insightsMatch[1].trim();

  return sections;
}

function parseTopEmployers(text: string): TopEmployer[] {
  const employers: TopEmployer[] = [];
  const lines = text.split("\n").filter((line) => line.trim().startsWith("-"));

  for (const line of lines) {
    const companyName = line.replace(/^-\s*/, "").trim();
    if (companyName) {
      employers.push({
        name: companyName,
        openings: 1, // Default since simplified format doesn't include counts
      });
    }
  }

  return employers;
}

function parseSkills(text: string): Skill[] {
  const skills: Skill[] = [];
  const lines = text.split("\n").filter((line) => line.trim().startsWith("-"));

  for (const line of lines) {
    // Pattern: - Skill Name (trending up/down/stable)
    const match = line.match(/^-\s*([^(]+)\s*\(trending\s+(up|down|stable)\)/i);
    if (match) {
      skills.push({
        name: match[1].trim(),
        demand: "high", // Default since simplified format doesn't specify
        count: 1,
      });
    }
  }

  return skills;
}

function parseMarketInsights(text: string): MarketTrend[] {
  const trends: MarketTrend[] = [];

  // Split the insights text into sentences/paragraphs
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length > 0) {
    // Create a single trend from the insights
    trends.push({
      trend: "Market Overview",
      description: sentences.join(". "),
      impact: "neutral" as const,
    });
  }

  return trends;
}
