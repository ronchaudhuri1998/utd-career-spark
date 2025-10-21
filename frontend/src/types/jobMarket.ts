import { parseNaturalLanguageJobMarket } from "./jobMarketParser";

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string; // Full-time, Part-time, Internship, Contract
  skills: string[];
  posted?: string;
  description?: string;
}

export interface HotRole {
  role: string;
  count: number;
  trend: "up" | "down" | "stable";
}

export interface Skill {
  name: string;
  demand: "high" | "medium" | "low";
  count: number;
}

export interface TopEmployer {
  name: string;
  openings: number;
  location?: string;
}

export interface MarketTrend {
  trend: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
}

export interface JobMarketInsights {
  hotRoles: HotRole[];
  skills: Skill[];
  topEmployers: TopEmployer[];
  marketTrends: MarketTrend[];
}

export interface JobMarketData {
  listings: JobListing[];
  insights: JobMarketInsights;
}

/**
 * Validates and parses job market data from AI-generated text
 * Supports both JSON and natural language formats
 */
export function validateJobMarketData(text: string): JobMarketData | null {
  if (!text || !text.trim()) {
    return null;
  }

  // First, try to parse as JSON
  const jsonResult = tryParseAsJSON(text);
  if (jsonResult) {
    return jsonResult;
  }

  // If JSON fails, try natural language parsing
  // Import is done in jobMarketParser.ts to keep separation
  return tryParseAsNaturalLanguage(text);
}

function tryParseAsNaturalLanguage(text: string): JobMarketData | null {
  try {
    return parseNaturalLanguageJobMarket(text);
  } catch (error) {
    console.error("Failed to parse as natural language:", error);
    return null;
  }
}

function tryParseAsJSON(text: string): JobMarketData | null {
  try {
    const parsed = JSON.parse(text);

    // Validate structure
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    // Ensure listings array exists
    if (!Array.isArray(parsed.listings)) {
      return null;
    }

    // Validate insights object
    if (!parsed.insights || typeof parsed.insights !== "object") {
      return null;
    }

    const insights = parsed.insights;
    if (
      !Array.isArray(insights.hotRoles) ||
      !Array.isArray(insights.skills) ||
      !Array.isArray(insights.topEmployers) ||
      !Array.isArray(insights.marketTrends)
    ) {
      return null;
    }

    // Type-safe return
    return {
      listings: parsed.listings.map((listing: unknown, index: number) => {
        const item = listing as Record<string, unknown>;
        return {
          id: typeof item.id === "string" ? item.id : `listing-${index}`,
          title:
            typeof item.title === "string" ? item.title : "Unknown Position",
          company:
            typeof item.company === "string" ? item.company : "Unknown Company",
          location:
            typeof item.location === "string"
              ? item.location
              : "Location not specified",
          salary: typeof item.salary === "string" ? item.salary : undefined,
          type: typeof item.type === "string" ? item.type : "Full-time",
          skills: Array.isArray(item.skills) ? item.skills : [],
          posted: typeof item.posted === "string" ? item.posted : undefined,
          description:
            typeof item.description === "string" ? item.description : undefined,
        };
      }),
      insights: {
        hotRoles: insights.hotRoles.map((role: unknown) => {
          const r = role as Record<string, unknown>;
          return {
            role: typeof r.role === "string" ? r.role : "Unknown",
            count: typeof r.count === "number" ? r.count : Number(r.count) || 0,
            trend:
              r.trend === "up" || r.trend === "down" || r.trend === "stable"
                ? r.trend
                : "stable",
          };
        }),
        skills: insights.skills.map((skill: unknown) => {
          const s = skill as Record<string, unknown>;
          return {
            name: typeof s.name === "string" ? s.name : "Unknown",
            demand:
              s.demand === "high" || s.demand === "medium" || s.demand === "low"
                ? s.demand
                : "medium",
            count: typeof s.count === "number" ? s.count : Number(s.count) || 0,
          };
        }),
        topEmployers: insights.topEmployers.map((employer: unknown) => {
          const e = employer as Record<string, unknown>;
          return {
            name: typeof e.name === "string" ? e.name : "Unknown",
            openings:
              typeof e.openings === "number"
                ? e.openings
                : Number(e.openings) || 0,
            location: typeof e.location === "string" ? e.location : undefined,
          };
        }),
        marketTrends: insights.marketTrends.map((trend: unknown) => {
          const t = trend as Record<string, unknown>;
          return {
            trend: typeof t.trend === "string" ? t.trend : "Unknown trend",
            description: typeof t.description === "string" ? t.description : "",
            impact:
              t.impact === "positive" ||
              t.impact === "negative" ||
              t.impact === "neutral"
                ? t.impact
                : "neutral",
          };
        }),
      },
    };
  } catch (error) {
    console.error("Failed to validate job market data:", error);
    return null;
  }
}
