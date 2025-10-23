import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Briefcase,
  BookOpen,
  Sparkles,
  User,
  Code,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useUserData } from "@/contexts/UserDataContext";
import { useSSEContext } from "@/contexts/SSEContext";
import MainChatOverlayStreaming from "@/components/MainChatOverlayStreaming";
import OnboardingModal from "@/components/OnboardingModal";
import StatsGrid from "@/components/StatsGrid";
import {
  extractJobMarketStats,
  extractCourseStats,
  extractProjectStats,
  type StatItem,
} from "@/lib/statsParser";

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
  stats,
  emptyMessage,
  navigating,
  loading,
  agentName,
  runningAgents,
}: {
  icon: typeof Briefcase;
  title: string;
  subtitle: string;
  items: string[];
  stats?: StatItem[];
  emptyMessage: string;
  navigating: () => void;
  loading: boolean;
  agentName: string;
  runningAgents: string[];
}) => {
  const isAgentRunning = runningAgents.includes(agentName);
  const showLoading = loading || isAgentRunning;

  return (
    <Card
      className={`border-2 shadow-card hover:border-primary/30 transition-colors h-full flex flex-col ${
        isAgentRunning ? "border-primary/50 animate-pulse" : ""
      }`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg bg-gradient-primary text-white shadow-sm ${
              isAgentRunning ? "animate-spin" : ""
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Badge
          variant={showLoading ? "secondary" : "outline"}
          className={`text-xs ${isAgentRunning ? "animate-pulse" : ""}`}
        >
          {isAgentRunning ? "Running" : showLoading ? "Refreshing" : "Ready"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-1 flex-1 flex flex-col min-h-0 p-4 pt-0">
        <div className="flex-1 min-h-0 overflow-hidden">
          {showLoading ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground">
                {isAgentRunning
                  ? `${agentName} is analyzing data...`
                  : "Agents are gathering the latest insights..."}
              </p>
            </div>
          ) : stats && stats.length > 0 ? (
            <StatsGrid stats={stats} />
          ) : items.length ? (
            <ul className="space-y-2 h-full overflow-y-auto pr-2">
              {items.slice(0, MAX_ITEMS).map((line, idx) => (
                <li
                  key={`${title}-${idx}`}
                  className="text-sm text-foreground leading-relaxed flex gap-2"
                >
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="break-words">{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          )}
        </div>
        <Button
          onClick={navigating}
          variant="outline"
          className="justify-start gap-2 text-sm flex-shrink-0 h-8 mt-4"
        >
          View full dashboard
        </Button>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    userData,
    agentOutputs,
    sectionLoading,
    resetUserData,
    sessionId,
    setSessionId,
    sessionContextInitialized,
    setSessionContextInitialized,
  } = useUserData();
  const useSSEReturn = useSSEContext();
  const { isConnected, isRunning, runningAgents, agentCards, result, error } =
    useSSEReturn;
  const [showOnboarding, setShowOnboarding] = useState(false);

  const jobMarketLines = useMemo(
    () => textToList(agentOutputs.jobMarket),
    [agentOutputs.jobMarket]
  );
  const coursePlanLines = useMemo(
    () => textToList(agentOutputs.coursePlan),
    [agentOutputs.coursePlan]
  );
  const projectLines = useMemo(
    () => textToList(agentOutputs.projectRecommendations),
    [agentOutputs.projectRecommendations]
  );
  const finalPlanHighlights = useMemo(
    () => textToList(agentOutputs.finalPlan).slice(0, MAX_ITEMS),
    [agentOutputs.finalPlan]
  );

  // Parse statistics from agent outputs
  const jobMarketStats = useMemo(
    () => extractJobMarketStats(agentOutputs.jobMarket),
    [agentOutputs.jobMarket]
  );

  const courseStats = useMemo(
    () => extractCourseStats(agentOutputs.coursePlan),
    [agentOutputs.coursePlan]
  );

  const projectStats = useMemo(
    () => extractProjectStats(agentOutputs.projectRecommendations),
    [agentOutputs.projectRecommendations]
  );

  const handleClearLocalStorage = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This will reset your profile and career plan."
      )
    ) {
      // Use the proper context method to reset user data
      resetUserData();
      setSessionId(""); // Clear session ID
      toast.success("All data cleared successfully");

      // TODO: Clear AgentCore session memory when implemented
      // Example: runtime.clear_session(session_id)

      setShowOnboarding(true);
    }
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              Your AI Career Copilot
            </h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => navigate("/profile")}
              className="rounded-full w-fit px-5 bg-primary hover:bg-primary/90"
            >
              <User className="w-4 h-4 mr-2" />
              Profile & Preferences
            </Button>
            <Button
              onClick={handleClearLocalStorage}
              variant="destructive"
              className="rounded-full w-fit px-5"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Data
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[600px] max-h-[calc(100vh-12rem)]"
        >
          {/* Left Panel - Chat */}
          <ResizablePanel
            defaultSize={33}
            minSize={25}
            maxSize={50}
            className="min-w-[300px]"
          >
            <div className="h-full">
              <MainChatOverlayStreaming />
            </div>
          </ResizablePanel>

          {/* Resizable Handle */}
          <ResizableHandle withHandle className="mx-2" />

          {/* Right Panel - Dashboard Cards */}
          <ResizablePanel defaultSize={67} minSize={50} maxSize={75}>
            <div className="flex flex-col gap-3 h-full">
              <div className="flex-1 min-h-[200px]">
                <InsightsCard
                  icon={Briefcase}
                  title="Job Market Dashboard"
                  subtitle="Roles, employers, and salary signals powering your plan"
                  items={jobMarketLines}
                  stats={jobMarketStats}
                  emptyMessage="Generate a plan to see current job market highlights."
                  navigating={() => navigate("/job-market")}
                  loading={sectionLoading.jobMarket}
                  agentName="JobMarketAgent"
                  runningAgents={runningAgents}
                />
              </div>

              <div className="flex-1 min-h-[200px]">
                <InsightsCard
                  icon={BookOpen}
                  title="Course Dashboard"
                  subtitle="Courses and campus resources aligned with your goal"
                  items={coursePlanLines}
                  stats={courseStats}
                  emptyMessage="Generate a plan to unlock your tailored course roadmap."
                  navigating={() => navigate("/academics")}
                  loading={sectionLoading.academics}
                  agentName="CourseCatalogAgent"
                  runningAgents={runningAgents}
                />
              </div>

              <div className="flex-1 min-h-[200px]">
                <InsightsCard
                  icon={Code}
                  title="Projects Dashboard"
                  subtitle="Portfolio projects and skill-building recommendations"
                  items={projectLines}
                  stats={projectStats}
                  emptyMessage="Generate a plan to see personalized project suggestions."
                  navigating={() => navigate("/projects")}
                  loading={sectionLoading.projects}
                  agentName="ProjectAdvisorAgent"
                  runningAgents={runningAgents}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      <OnboardingModal open={showOnboarding} onClose={handleOnboardingClose} />
    </div>
  );
};

export default Dashboard;
