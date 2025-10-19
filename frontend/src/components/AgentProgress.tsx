import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { AgentProgress as AgentProgressType } from "@/lib/websocket";

interface AgentProgressProps {
  progress: AgentProgressType[];
  isRunning: boolean;
}

const agentBadgeStyles: Record<string, string> = {
  JobMarketAgent: "bg-orange-500/10 text-orange-700 border-orange-200",
  CourseCatalogAgent: "bg-green-500/10 text-green-700 border-green-200",
  ProjectAdvisorAgent: "bg-blue-500/10 text-blue-700 border-blue-200",
  CareerPlannerAgent: "bg-purple-500/10 text-purple-700 border-purple-200",
};

const agentLabels: Record<string, string> = {
  JobMarketAgent: "Job Market Analyst",
  CourseCatalogAgent: "Course Catalog Specialist",
  ProjectAdvisorAgent: "Project Advisor",
  CareerPlannerAgent: "Career Planner",
};

export const AgentProgress: React.FC<AgentProgressProps> = ({
  progress,
  isRunning,
}) => {
  // Group progress by agent
  const agentGroups = progress.reduce((acc, item) => {
    if (!acc[item.agent]) {
      acc[item.agent] = [];
    }
    acc[item.agent].push(item);
    return acc;
  }, {} as Record<string, AgentProgressType[]>);

  const agents = [
    "JobMarketAgent",
    "CourseCatalogAgent",
    "ProjectAdvisorAgent",
    "CareerPlannerAgent",
  ];

  // Calculate progress percentage
  const totalSteps = agents.length * 2; // Each agent has start + complete steps
  const completedSteps = progress.filter(
    (p) => p.event.includes("Completed") || p.event.includes("Generated")
  ).length;
  const progressPercentage =
    totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className={`w-5 h-5 ${isRunning ? "animate-spin" : ""}`} />
          Agent Progress
          {isRunning && (
            <Badge variant="outline" className="ml-auto">
              Running
            </Badge>
          )}
        </CardTitle>
        <Progress value={progressPercentage} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        {agents.map((agent) => {
          const agentProgress = agentGroups[agent] || [];
          const isCompleted = agentProgress.some(
            (p) =>
              p.event.includes("Completed") || p.event.includes("Generated")
          );
          const isActive =
            agentProgress.length > 0 && !isCompleted && isRunning;

          return (
            <div
              key={agent}
              className="flex items-center gap-3 p-3 rounded-lg border"
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={agentBadgeStyles[agent] || ""}
                  >
                    {agentLabels[agent] || agent}
                  </Badge>
                  {isCompleted && (
                    <Badge variant="secondary" className="text-xs">
                      Complete
                    </Badge>
                  )}
                </div>

                {agentProgress.length > 0 && (
                  <div className="space-y-1">
                    {agentProgress.map((item, index) => (
                      <div
                        key={index}
                        className="text-sm text-muted-foreground"
                      >
                        <div className="font-medium">{item.event}</div>
                        {item.output && (
                          <div className="text-xs mt-1 p-2 bg-muted rounded text-foreground">
                            {item.output.length > 200
                              ? `${item.output.substring(0, 200)}...`
                              : item.output}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {progress.length === 0 && !isRunning && (
          <div className="text-center text-muted-foreground py-8">
            No progress yet. Start a plan to see agent activity.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
