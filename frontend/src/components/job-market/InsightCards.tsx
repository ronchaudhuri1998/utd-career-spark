import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Target,
  Building2,
  BarChart3,
  Info,
} from "lucide-react";
import { JobMarketInsights } from "@/types/jobMarket";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface InsightCardsProps {
  insights: JobMarketInsights;
}

export const InsightCards = ({ insights }: InsightCardsProps) => {
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case "stable":
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDemandBadgeVariant = (
    demand: "high" | "medium" | "low"
  ): "default" | "secondary" | "outline" => {
    switch (demand) {
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      {/* Hot Roles */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Hot Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {insights.hotRoles.length > 0 ? (
              insights.hotRoles.map((role, idx) => (
                <HoverCard key={idx} openDelay={0} closeDelay={0}>
                  <HoverCardTrigger>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80 transition-colors gap-1"
                    >
                      {role.role}
                      <Info className="w-3 h-3 opacity-60" />
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64" align="start">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">{role.role}</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="flex items-center justify-between">
                          <span>Openings:</span>
                          <span className="font-medium text-foreground">
                            {role.count}
                          </span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span>Trend:</span>
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            {getTrendIcon(role.trend)}
                            {role.trend}
                          </span>
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 w-full">
                No hot roles data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            In-Demand Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {insights.skills.length > 0 ? (
              insights.skills.map((skill, idx) => (
                <HoverCard key={idx} openDelay={0} closeDelay={0}>
                  <HoverCardTrigger>
                    <Badge
                      variant={getDemandBadgeVariant(skill.demand)}
                      className="cursor-pointer hover:opacity-80 transition-opacity gap-1"
                    >
                      {skill.name}
                      <Info className="w-3 h-3 opacity-60" />
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64" align="start">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">{skill.name}</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="flex items-center justify-between">
                          <span>Demand Level:</span>
                          <Badge
                            variant={getDemandBadgeVariant(skill.demand)}
                            className="text-xs"
                          >
                            {skill.demand}
                          </Badge>
                        </p>
                        <p className="flex items-center justify-between">
                          <span>Listings:</span>
                          <span className="font-medium text-foreground">
                            {skill.count}
                          </span>
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 w-full">
                No skills data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Employers */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Top Employers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {insights.topEmployers.length > 0 ? (
              insights.topEmployers.map((employer, idx) => (
                <HoverCard key={idx} openDelay={0} closeDelay={0}>
                  <HoverCardTrigger>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-accent transition-colors gap-1"
                    >
                      {employer.name}
                      <Info className="w-3 h-3 opacity-60" />
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64" align="start">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">{employer.name}</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="flex items-center justify-between">
                          <span>Open Positions:</span>
                          <span className="font-medium text-foreground">
                            {employer.openings}
                          </span>
                        </p>
                        {employer.location && (
                          <p className="flex items-center justify-between">
                            <span>Location:</span>
                            <span className="font-medium text-foreground">
                              {employer.location}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 w-full">
                No employer data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Market Trends */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Market Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {insights.marketTrends.length > 0 ? (
              insights.marketTrends.map((trend, idx) => (
                <HoverCard key={idx} openDelay={0} closeDelay={0}>
                  <HoverCardTrigger>
                    <Badge
                      variant={
                        trend.impact === "positive"
                          ? "default"
                          : trend.impact === "negative"
                          ? "destructive"
                          : "secondary"
                      }
                      className="cursor-pointer hover:opacity-80 transition-opacity gap-1"
                    >
                      {trend.trend}
                      {trend.description && (
                        <Info className="w-3 h-3 opacity-60" />
                      )}
                    </Badge>
                  </HoverCardTrigger>
                  {trend.description && (
                    <HoverCardContent className="w-80" align="start">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">
                            {trend.trend}
                          </h4>
                          <Badge
                            variant={
                              trend.impact === "positive"
                                ? "default"
                                : trend.impact === "negative"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {trend.impact}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {trend.description}
                        </p>
                      </div>
                    </HoverCardContent>
                  )}
                </HoverCard>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 w-full">
                No trend data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
