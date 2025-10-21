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
 * === JOB LISTINGS ===
 *
 * Job #1:
 * Title: Software Engineer
 * Company: Tech Corp
 * Location: Dallas, TX
 * Salary: $80k-120k
 * Type: Full-time
 * Skills: React, Node.js, TypeScript
 * Posted: 2 days ago
 * Description: Looking for a talented engineer...
 *
 * === HOT ROLES ===
 * - Software Engineer (150 openings) [trending up]
 * - Frontend Developer (85 openings) [stable]
 *
 * === IN-DEMAND SKILLS ===
 * - React (high demand, 200 listings)
 * - Python (medium demand, 120 listings)
 *
 * === TOP EMPLOYERS ===
 * - Tech Corp (25 openings, Dallas TX)
 * - Innovation Labs (18 openings)
 *
 * === MARKET TRENDS ===
 * [POSITIVE] AI/ML Integration
 * Increasing demand for AI and machine learning skills...
 *
 * [NEUTRAL] Remote Work Normalization
 * More companies offering remote options...
 */
export function parseNaturalLanguageJobMarket(
  text: string
): JobMarketData | null {
  try {
    const sections = splitIntoSections(text);

    const listings = parseJobListings(sections.listings || "");
    const hotRoles = parseHotRoles(sections.hotRoles || "");
    const skills = parseSkills(sections.skills || "");
    const topEmployers = parseTopEmployers(sections.employers || "");
    const marketTrends = parseMarketTrends(sections.trends || "");

    // Validate we have at least some data
    if (listings.length === 0 && hotRoles.length === 0 && skills.length === 0) {
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
  const listingsMatch = text.match(
    /===\s*JOB LISTINGS\s*===([\s\S]*?)(?====|$)/i
  );
  const hotRolesMatch = text.match(/===\s*HOT ROLES\s*===([\s\S]*?)(?====|$)/i);
  const skillsMatch = text.match(
    /===\s*IN-DEMAND SKILLS\s*===([\s\S]*?)(?====|$)/i
  );
  const employersMatch = text.match(
    /===\s*TOP EMPLOYERS\s*===([\s\S]*?)(?====|$)/i
  );
  const trendsMatch = text.match(
    /===\s*MARKET TRENDS\s*===([\s\S]*?)(?====|$)/i
  );

  if (listingsMatch) sections.listings = listingsMatch[1].trim();
  if (hotRolesMatch) sections.hotRoles = hotRolesMatch[1].trim();
  if (skillsMatch) sections.skills = skillsMatch[1].trim();
  if (employersMatch) sections.employers = employersMatch[1].trim();
  if (trendsMatch) sections.trends = trendsMatch[1].trim();

  return sections;
}

function parseJobListings(text: string): JobListing[] {
  const listings: JobListing[] = [];

  // Split by "Job #N:" pattern
  const jobBlocks = text.split(/Job\s+#\d+:/i).filter(Boolean);

  jobBlocks.forEach((block, index) => {
    const lines = block.trim().split("\n");
    const job: Partial<JobListing> = {
      id: `job-${index + 1}`,
      skills: [],
    };

    let description = "";
    let inDescription = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("Title:")) {
        job.title = trimmed.replace(/^Title:\s*/i, "").trim();
        inDescription = false;
      } else if (trimmed.startsWith("Company:")) {
        job.company = trimmed.replace(/^Company:\s*/i, "").trim();
        inDescription = false;
      } else if (trimmed.startsWith("Location:")) {
        job.location = trimmed.replace(/^Location:\s*/i, "").trim();
        inDescription = false;
      } else if (trimmed.startsWith("Salary:")) {
        job.salary = trimmed.replace(/^Salary:\s*/i, "").trim();
        inDescription = false;
      } else if (trimmed.startsWith("Type:")) {
        job.type = trimmed.replace(/^Type:\s*/i, "").trim();
        inDescription = false;
      } else if (trimmed.startsWith("Skills:")) {
        const skillsText = trimmed.replace(/^Skills:\s*/i, "").trim();
        job.skills = skillsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        inDescription = false;
      } else if (trimmed.startsWith("Posted:")) {
        job.posted = trimmed.replace(/^Posted:\s*/i, "").trim();
        inDescription = false;
      } else if (trimmed.startsWith("Description:")) {
        description = trimmed.replace(/^Description:\s*/i, "").trim();
        inDescription = true;
      } else if (inDescription) {
        description += " " + trimmed;
      }
    }

    if (description) {
      job.description = description.trim();
    }

    // Only add if we have at least title and company
    if (job.title && job.company) {
      listings.push({
        id: job.id!,
        title: job.title,
        company: job.company,
        location: job.location || "Location not specified",
        salary: job.salary,
        type: job.type || "Full-time",
        skills: job.skills || [],
        posted: job.posted,
        description: job.description,
      });
    }
  });

  return listings;
}

function parseHotRoles(text: string): HotRole[] {
  const roles: HotRole[] = [];
  const lines = text.split("\n").filter((line) => line.trim().startsWith("-"));

  for (const line of lines) {
    // Pattern: - Role Name (count openings) [trend]
    const match = line.match(
      /^-\s*([^(]+)\s*\((\d+)\s*openings?\)\s*\[(?:trending\s+)?(up|down|stable)\]/i
    );
    if (match) {
      roles.push({
        role: match[1].trim(),
        count: parseInt(match[2]),
        trend: match[3].toLowerCase() as "up" | "down" | "stable",
      });
    }
  }

  return roles;
}

function parseSkills(text: string): Skill[] {
  const skills: Skill[] = [];
  const lines = text.split("\n").filter((line) => line.trim().startsWith("-"));

  for (const line of lines) {
    // Pattern: - Skill Name (demand level, count listings)
    const match = line.match(
      /^-\s*([^(]+)\s*\((high|medium|low)\s*demand,\s*(\d+)\s*listings?\)/i
    );
    if (match) {
      skills.push({
        name: match[1].trim(),
        demand: match[2].toLowerCase() as "high" | "medium" | "low",
        count: parseInt(match[3]),
      });
    }
  }

  return skills;
}

function parseTopEmployers(text: string): TopEmployer[] {
  const employers: TopEmployer[] = [];
  const lines = text.split("\n").filter((line) => line.trim().startsWith("-"));

  for (const line of lines) {
    // Pattern: - Company Name (count openings, location)
    // or: - Company Name (count openings)
    const matchWithLocation = line.match(
      /^-\s*([^(]+)\s*\((\d+)\s*openings?,\s*([^)]+)\)/i
    );
    const matchWithoutLocation = line.match(
      /^-\s*([^(]+)\s*\((\d+)\s*openings?\)/i
    );

    if (matchWithLocation) {
      employers.push({
        name: matchWithLocation[1].trim(),
        openings: parseInt(matchWithLocation[2]),
        location: matchWithLocation[3].trim(),
      });
    } else if (matchWithoutLocation) {
      employers.push({
        name: matchWithoutLocation[1].trim(),
        openings: parseInt(matchWithoutLocation[2]),
      });
    }
  }

  return employers;
}

function parseMarketTrends(text: string): MarketTrend[] {
  const trends: MarketTrend[] = [];

  // Split by impact markers
  const trendBlocks = text
    .split(/\[(POSITIVE|NEGATIVE|NEUTRAL)\]/i)
    .filter(Boolean);

  for (let i = 0; i < trendBlocks.length; i += 2) {
    if (i + 1 >= trendBlocks.length) break;

    const impact = trendBlocks[i].trim().toLowerCase() as
      | "positive"
      | "negative"
      | "neutral";
    const content = trendBlocks[i + 1].trim();

    const lines = content.split("\n").filter(Boolean);
    if (lines.length > 0) {
      const trendName = lines[0].trim();
      const description = lines.slice(1).join(" ").trim();

      trends.push({
        trend: trendName,
        description: description || trendName,
        impact,
      });
    }
  }

  return trends;
}
