import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  GitBranch,
  Target,
  BookMarked,
  Info,
  Award,
  ExternalLink,
} from "lucide-react";
import { CourseInsights } from "@/types/course";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

interface CourseInsightCardsProps {
  insights: CourseInsights;
}

export const CourseInsightCards = ({ insights }: CourseInsightCardsProps) => {
  const getImportanceBadgeVariant = (
    importance: "high" | "medium" | "low"
  ): "default" | "secondary" | "outline" => {
    switch (importance) {
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "tutoring":
        return "📚";
      case "workshop":
        return "🛠️";
      case "lab":
        return "🔬";
      case "club":
        return "👥";
      case "certification":
        return "🏆";
      default:
        return "📌";
    }
  };

  return (
    <div className="space-y-4">
      {/* Semester Plan */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Semester Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.semesters.length > 0 ? (
              insights.semesters.map((semester, idx) => (
                <Card key={idx} className="border bg-accent/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{semester.name}</h4>
                      <Badge variant="secondary" className="gap-1">
                        <Award className="w-3 h-3" />
                        {semester.totalCredits} credits
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {semester.courses.map((course, courseIdx) => (
                        <Badge
                          key={courseIdx}
                          variant="outline"
                          className="text-xs"
                        >
                          {course}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No semester plan available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prerequisites */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            Prerequisites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.prerequisites.length > 0 ? (
              insights.prerequisites.map((prereq, idx) => (
                <HoverCard key={idx} openDelay={0} closeDelay={0}>
                  <HoverCardTrigger>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80 transition-colors gap-1"
                    >
                      {prereq.course}
                      <Info className="w-3 h-3 opacity-60" />
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72" align="start">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">{prereq.course}</h4>
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Required for:</p>
                        <div className="flex flex-wrap gap-1">
                          {prereq.requiredFor.map((course, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {course}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No prerequisite data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skill Areas */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Skill Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.skillAreas.length > 0 ? (
              insights.skillAreas.map((skillArea, idx) => (
                <HoverCard key={idx} openDelay={0} closeDelay={0}>
                  <HoverCardTrigger>
                    <Badge
                      variant={getImportanceBadgeVariant(skillArea.importance)}
                      className="cursor-pointer hover:opacity-80 transition-opacity gap-1"
                    >
                      {skillArea.area}
                      <Info className="w-3 h-3 opacity-60" />
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">
                          {skillArea.area}
                        </h4>
                        <Badge
                          variant={getImportanceBadgeVariant(
                            skillArea.importance
                          )}
                          className="text-xs"
                        >
                          {skillArea.importance}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Related courses:</p>
                        <div className="flex flex-wrap gap-1">
                          {skillArea.courses.map((course, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {course}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No skill area data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Academic Resources */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-primary" />
            Academic Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.resources.length > 0 ? (
              insights.resources.map((resource, idx) => (
                <Card key={idx} className="border bg-accent/30">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {getResourceIcon(resource.type)}
                      </span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-sm">
                            {resource.name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {resource.type}
                          </Badge>
                        </div>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {resource.description}
                          </p>
                        )}
                        {resource.link && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            asChild
                          >
                            <a
                              href={resource.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              Learn more
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No resource data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
