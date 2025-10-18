import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lightbulb, Code, Sparkles } from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";

const toBullets = (text: string) =>
  text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

const Projects = () => {
  const navigate = useNavigate();
  const { agentOutputs, sectionLoading, userData } = useUserData();

  const projectBullets = useMemo(
    () => toBullets(agentOutputs.projectRecommendations),
    [agentOutputs.projectRecommendations]
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-5 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Portfolio Projects
            </h1>
            <p className="text-sm text-muted-foreground">
              Agent-curated build ideas aligned with {userData.careerGoal || "your goal"}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        <Card className="border-2 shadow-card">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recommended Projects</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sprints from the Project Advisor agent. Build them to validate skills the Job Market Agent surfaced.
              </p>
            </div>
            <Badge variant={sectionLoading.projects ? "secondary" : "outline"}>
              {sectionLoading.projects ? "Refreshing" : "Ready"}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4">
            {projectBullets.length ? (
              projectBullets.map((line, idx) => (
                <div
                  key={`project-${idx}`}
                  className="border border-primary/20 bg-primary/5 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Code className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {line}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                Run the onboarding flow to unlock project recommendations tailored to your target role.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-dashed border-primary/40 bg-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              How these were generated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              The Project Advisor agent ingests live job market signals and course plans to craft projects that prove core competencies.
            </p>
            <p>
              Regenerating the plan (from onboarding or the dashboard chat) refreshes these ideas with the latest agent insights.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Projects;
