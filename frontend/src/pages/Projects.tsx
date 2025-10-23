import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Lightbulb,
  Sparkles,
  AlertCircle,
  TestTube2,
} from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";
import { validateProjectData } from "@/types/project";
import { ProjectCards } from "@/components/projects/ProjectCards";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { mockProjectData } from "@/data/mockProjectData";
import { toast } from "sonner";
import DashboardEmbeddedChat from "@/components/chat/DashboardEmbeddedChat";

const Projects = () => {
  const navigate = useNavigate();
  const { agentOutputs, sectionLoading, userData, setAgentOutputs } =
    useUserData();

  // Validate and parse project data
  const parsedData = useMemo(() => {
    if (!agentOutputs.projectRecommendations) return null;
    return validateProjectData(agentOutputs.projectRecommendations);
  }, [agentOutputs.projectRecommendations]);

  const loadMockData = () => {
    setAgentOutputs({
      ...agentOutputs,
      projectRecommendations: mockProjectData,
    });
    toast.success("Mock project data loaded successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-full px-6 py-5 flex items-center gap-4">
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
              Agent-curated build ideas aligned with{" "}
              {userData.careerGoal || "your goal"}
            </p>
          </div>
          <Badge
            variant={sectionLoading.projects ? "secondary" : "outline"}
            className="ml-auto"
          >
            {sectionLoading.projects ? "Refreshing" : "Updated"}
          </Badge>
        </div>
      </header>

      <main className="w-full px-6 py-8">
        {!agentOutputs.projectRecommendations ? (
          <Card className="border-2">
            <CardContent className="py-12 text-center space-y-4">
              <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  No Project Recommendations
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Run the onboarding flow to get personalized project
                  recommendations tailored to your career goal.
                </p>
                <Button
                  onClick={loadMockData}
                  variant="outline"
                  className="gap-2"
                >
                  <TestTube2 className="w-4 h-4" />
                  Load Mock Data
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : parsedData ? (
          <div className="grid lg:grid-cols-[1fr_450px] gap-6 w-full">
            {/* Left: Dashboard Content */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  Recommended Projects
                  <Badge variant="outline">{parsedData.projects.length}</Badge>
                </h2>
                <ProjectCards projects={parsedData.projects} />
              </div>

              <Card className="border border-dashed border-primary/40 bg-white">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    How these were generated
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    The Project Advisor agent ingests live job market signals
                    and course plans to craft projects that prove core
                    competencies.
                  </p>
                  <p>
                    Regenerating the plan (from onboarding or the dashboard
                    chat) refreshes these ideas with the latest agent insights.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right: Embedded Chat */}
            <div>
              <DashboardEmbeddedChat
                title="Project Advisor"
                dashboardType="projects"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to Parse Data</AlertTitle>
              <AlertDescription>
                <div className="flex items-center justify-between gap-4">
                  <span>
                    The project data could not be parsed into the interactive
                    dashboard format.
                  </span>
                  <Button
                    onClick={loadMockData}
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0"
                  >
                    <TestTube2 className="w-3 h-3" />
                    Load Mock Data
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  Project Recommendations
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Unable to parse data into interactive dashboard format.
                </p>
              </CardHeader>
              <CardContent>
                <div className="border border-primary/20 bg-primary/5 rounded-xl p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                    {agentOutputs.projectRecommendations}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;
