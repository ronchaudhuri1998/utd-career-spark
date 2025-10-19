import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, BookOpen, MessageCircle, Sparkles, User } from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";
import MainChatOverlayStreaming from "@/components/MainChatOverlayStreaming";

const textToList = (text: string) =>
  text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

const MAX_ITEMS = 4;

const InsightsCard = ({
  icon: Icon,
  title,
  subtitle,
  items,
  emptyMessage,
  navigating,
  loading,
}: {
  icon: typeof Briefcase;
  title: string;
  subtitle: string;
  items: string[];
  emptyMessage: string;
  navigating: () => void;
  loading: boolean;
}) => (
  <Card className="border-2 shadow-card hover:border-primary/30 transition-colors">
    <CardHeader className="flex flex-row items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-primary text-white shadow-sm">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Badge variant={loading ? "secondary" : "outline"}>
        {loading ? "Refreshing" : "Ready"}
      </Badge>
    </CardHeader>
    <CardContent className="space-y-4">
      {loading ? (
        <p className="text-sm text-muted-foreground animate-pulse">
          Agents are gathering the latest insights...
        </p>
      ) : items.length ? (
        <ul className="space-y-2">
          {items.slice(0, MAX_ITEMS).map((line, idx) => (
            <li key={`${title}-${idx}`} className="text-sm text-foreground leading-relaxed flex gap-2">
              <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
      <Button onClick={navigating} variant="outline" className="justify-start gap-2">
        View full dashboard
      </Button>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { userData, agentOutputs, sectionLoading } = useUserData();

  const jobMarketLines = useMemo(
    () => textToList(agentOutputs.jobMarket),
    [agentOutputs.jobMarket]
  );
  const coursePlanLines = useMemo(
    () => textToList(agentOutputs.coursePlan),
    [agentOutputs.coursePlan]
  );
  const finalPlanHighlights = useMemo(
    () => textToList(agentOutputs.finalPlan).slice(0, MAX_ITEMS),
    [agentOutputs.finalPlan]
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              Your AI Career Copilot
            </h1>
            <p className="text-muted-foreground">
              Personalized roadmap for {userData.name || "you"} targeting{" "}
              {userData.careerGoal || "your dream role"}.
            </p>
          </div>
          <Button
            onClick={() => navigate("/profile")}
            className="rounded-full w-fit px-5 bg-primary hover:bg-primary/90"
          >
            <User className="w-4 h-4 mr-2" />
            Profile & Preferences
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <InsightsCard
              icon={Briefcase}
              title="Job Market Dashboard"
              subtitle="Roles, employers, and salary signals powering your plan"
              items={jobMarketLines}
              emptyMessage="Generate a plan to see current job market highlights."
              navigating={() => navigate("/job-market")}
              loading={sectionLoading.jobMarket}
            />

            <InsightsCard
              icon={BookOpen}
              title="Course Dashboard"
              subtitle="Courses and campus resources aligned with your goal"
              items={coursePlanLines}
              emptyMessage="Generate a plan to unlock your tailored course roadmap."
              navigating={() => navigate("/academics")}
              loading={sectionLoading.academics}
            />
          </div>

          <div className="space-y-6">
            <Card className="border-2 shadow-card">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Career Copilot Chat
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Ask follow-up questions or explore next steps anytime.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {finalPlanHighlights.length ? (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {finalPlanHighlights.map((line, idx) => (
                      <li
                        key={`plan-highlight-${idx}`}
                        className="flex gap-2 leading-relaxed"
                      >
                        <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Once your roadmap is generated, highlights will appear here.
                    Use the chat bubble to ask anything.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  The floating chat bubble stays active, so you can refine your
                  plan or request interview prep whenever you like.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <MainChatOverlayStreaming />
    </div>
  );
};

export default Dashboard;
