import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, GraduationCap, Sparkles } from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";

const toSections = (text: string) =>
  text
    .split(/\n\n+/)
    .map((section) => section.trim())
    .filter(Boolean);

const Academics = () => {
  const navigate = useNavigate();
  const { agentOutputs, sectionLoading, userData } = useUserData();

  const sections = useMemo(
    () => toSections(agentOutputs.coursePlan),
    [agentOutputs.coursePlan]
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
              <BookOpen className="w-5 h-5 text-primary" />
              Academic Roadmap
            </h1>
            <p className="text-sm text-muted-foreground">
              Coursework and resources aligned with {userData.careerGoal || "your goal"}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        <Card className="border-2 shadow-card">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Course & Skill Plan</CardTitle>
              <p className="text-sm text-muted-foreground">
                Curated by the Course Catalog Agent using job-market signals and your background.
              </p>
            </div>
            <Badge variant={sectionLoading.academics ? "secondary" : "outline"}>
              {sectionLoading.academics ? "Refreshing" : "Ready"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.length ? (
              sections.map((section, idx) => (
                <div
                  key={`academics-section-${idx}`}
                  className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-2"
                >
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {section}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Generate a plan to receive course recommendations, campus resources, and sequencing guidance.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-dashed border-primary/40 bg-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              How to act on this roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Meet with your academic advisor to confirm prerequisites and scheduling for the recommended courses.
            </p>
            <p>
              Layer the suggested extracurricular resources into your semester plan to reinforce the skills employers expect.
            </p>
            <p className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              Regenerate the plan as your goals evolve to keep this roadmap current.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Academics;
