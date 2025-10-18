import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowLeft, TrendingUp, Building, Sparkles, Briefcase } from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";

const textBlocks = (text: string) =>
  text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

const JobMarket = () => {
  const navigate = useNavigate();
  const { userData, agentOutputs, sectionLoading } = useUserData();

  const blocks = useMemo(() => textBlocks(agentOutputs.jobMarket), [
    agentOutputs.jobMarket,
  ]);

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
              <Briefcase className="w-5 h-5 text-primary" />
              Job Market Overview
            </h1>
            <p className="text-sm text-muted-foreground">
              Personalized market signals for {userData.careerGoal || "your goal"}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        <Card className="border-2 shadow-card">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Highlights</CardTitle>
              <p className="text-sm text-muted-foreground">
                What the Job Market Agent found across postings, skills, and employers.
              </p>
            </div>
            <Badge variant={sectionLoading.jobMarket ? "secondary" : "outline"}>
              {sectionLoading.jobMarket ? "Refreshing" : "Last generated"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {blocks.length ? (
              blocks.map((block, idx) => (
                <div
                  key={`job-block-${idx}`}
                  className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-2"
                >
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {block}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Run the onboarding flow to fetch live job market insights tailored to your goal.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-dashed border-primary/40 bg-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Agent Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Agent sequence: Job Market Agent → Course Catalog Agent → Project Advisor → Planner.
            </p>
            <p>
              Session location: {userData.location || "not specified"}. Desired role: {userData.careerGoal || "unknown"}.
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Update your goal from the chat bubble or onboarding to regenerate these insights.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {agentOutputs.trace?.map((entry, idx) => (
            entry.agent === "JobMarketAgent" ? (
              <Card
                key={`trace-job-${idx}`}
                className="border border-secondary bg-secondary/40"
              >
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    {entry.event}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {entry.output || "No details captured."}
                  </p>
                </CardContent>
              </Card>
            ) : null
          ))}
          {blocks.length === 0 && (
            <Card className="border bg-muted/40">
              <CardContent className="py-10 text-center text-muted-foreground space-y-2">
                <Building className="w-8 h-8 mx-auto text-muted-foreground/70" />
                <p>No agent trace available yet. Generate a plan to unlock detailed logs.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default JobMarket;
