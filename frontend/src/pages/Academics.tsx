import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  AlertCircle,
  TestTube2,
} from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";
import { validateCourseData } from "@/types/course";
import { CourseList } from "@/components/course/CourseList";
import { CourseInsightCards } from "@/components/course/CourseInsightCards";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { mockCourseData } from "@/data/mockCourseData";
import { toast } from "sonner";
import DashboardEmbeddedChat from "@/components/chat/DashboardEmbeddedChat";

const Academics = () => {
  const navigate = useNavigate();
  const { agentOutputs, sectionLoading, userData, setAgentOutputs } =
    useUserData();

  // Validate and parse course data
  const parsedData = useMemo(() => {
    if (!agentOutputs.coursePlan) return null;
    return validateCourseData(agentOutputs.coursePlan);
  }, [agentOutputs.coursePlan]);

  const loadMockData = () => {
    setAgentOutputs({
      ...agentOutputs,
      coursePlan: mockCourseData,
    });
    toast.success("Mock course data loaded successfully!");
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
              <BookOpen className="w-5 h-5 text-primary" />
              Academic Roadmap
            </h1>
            <p className="text-sm text-muted-foreground">
              Coursework and resources aligned with{" "}
              {userData.careerGoal || "your goal"}
            </p>
          </div>
          <Badge
            variant={sectionLoading.academics ? "secondary" : "outline"}
            className="ml-auto"
          >
            {sectionLoading.academics ? "Refreshing" : "Updated"}
          </Badge>
        </div>
      </header>

      <main className="w-full px-6 py-8 space-y-6">
        {!agentOutputs.coursePlan ? (
          <Card className="border-2">
            <CardContent className="py-12 text-center space-y-4">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-semibold mb-2">No Course Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Run the onboarding flow to fetch personalized course
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
          <>
            <div className="grid lg:grid-cols-[1fr_450px] gap-6 w-full">
              {/* Left: Dashboard Content */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Course Catalog */}
                <div>
                  <CourseList courses={parsedData.courses} />
                </div>

                {/* Course Insights */}
                <div>
                  <CourseInsightCards insights={parsedData.insights} />
                </div>
              </div>

              {/* Right: Embedded Chat */}
              <div>
                <DashboardEmbeddedChat
                  title="Academic Advisor"
                  dashboardType="academics"
                />
              </div>
            </div>

            <Card className="border border-dashed border-primary/40 bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  How to act on this roadmap
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Meet with your academic advisor to confirm prerequisites and
                  scheduling for the recommended courses.
                </p>
                <p>
                  Layer the suggested extracurricular resources into your
                  semester plan to reinforce the skills employers expect.
                </p>
                <p>
                  Regenerate the plan as your goals evolve to keep this roadmap
                  current.
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to Parse Data</AlertTitle>
              <AlertDescription>
                <div className="flex items-center justify-between gap-4">
                  <span>
                    The course data could not be parsed into the interactive
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
                <CardTitle className="text-lg">Course & Skill Plan</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Unable to parse data into interactive dashboard format.
                </p>
              </CardHeader>
              <CardContent>
                <div className="border border-primary/20 bg-primary/5 rounded-xl p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                    {agentOutputs.coursePlan}
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

export default Academics;
