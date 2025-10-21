import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Clock, TrendingUp, BookOpen } from "lucide-react";
import { Project } from "@/types/project";

interface ProjectCardsProps {
  projects: Project[];
}

export function ProjectCards({ projects }: ProjectCardsProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTimelineNodeColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500 border-green-300";
      case "intermediate":
        return "bg-yellow-500 border-yellow-300";
      case "advanced":
        return "bg-red-500 border-red-300";
      default:
        return "bg-gray-500 border-gray-300";
    }
  };

  if (projects.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="py-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No projects found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {projects.map((project, index) => (
        <div key={project.id} className="flex gap-6 md:gap-8">
          {/* Timeline Node and Line */}
          <div className="relative flex flex-col items-center pt-8">
            {/* Timeline Node */}
            <div
              className={`w-5 h-5 rounded-full border-4 ${getTimelineNodeColor(
                project.difficulty
              )} z-10 shadow-md flex-shrink-0`}
            />

            {/* Connecting Line */}
            {index < projects.length - 1 && (
              <div className="w-0.5 flex-1 mt-2 mb-2 bg-gradient-to-b from-primary/60 to-primary/30" />
            )}
          </div>

          {/* Project Card */}
          <div className="flex-1">
            <Card className="border-2 shadow-card hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className="text-xs font-mono text-muted-foreground"
                      >
                        Step {index + 1}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="w-5 h-5 text-primary" />
                      {project.title}
                    </CardTitle>
                    {project.category && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.category}
                      </p>
                    )}
                  </div>
                  <Badge className={getDifficultyColor(project.difficulty)}>
                    {project.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground leading-relaxed">
                  {project.description}
                </p>

                {project.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {project.estimatedTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{project.estimatedTime}</span>
                    </div>
                  )}
                </div>

                {project.careerRelevance && (
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-primary mb-1">
                          Career Relevance
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {project.careerRelevance}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}
