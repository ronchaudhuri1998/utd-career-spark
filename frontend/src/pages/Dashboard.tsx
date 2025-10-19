import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  BookOpen,
  MessageCircle,
  Sparkles,
  User,
  Bug,
} from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";
import { useWebSocket } from "@/hooks/useWebSocket";
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
  <Card className="border-2 shadow-card hover:border-primary/30 transition-colors h-full flex flex-col">
    <CardHeader className="flex flex-row items-start justify-between gap-3 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-primary text-white shadow-sm">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Badge variant={loading ? "secondary" : "outline"} className="text-xs">
        {loading ? "Refreshing" : "Ready"}
      </Badge>
    </CardHeader>
    <CardContent className="space-y-3 flex-1 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <p className="text-sm text-muted-foreground animate-pulse">
            Agents are gathering the latest insights...
          </p>
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
        className="justify-start gap-2 text-sm flex-shrink-0"
      >
        View full dashboard
      </Button>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { userData, agentOutputs, sectionLoading } = useUserData();
  const { isConnected, isRunning, runningAgents, progress, result, error } =
    useWebSocket();

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

      {/* Debug Panel */}
      <div className="container mx-auto px-6 py-4">
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-800">
              <Bug className="w-4 h-4" />
              Debug Info
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <div className="font-medium text-orange-700">
                  WebSocket Status
                </div>
                <Badge
                  variant={isConnected ? "default" : "destructive"}
                  className="text-xs"
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <div>
                <div className="font-medium text-orange-700">Plan Running</div>
                <Badge
                  variant={isRunning ? "default" : "secondary"}
                  className="text-xs"
                >
                  {isRunning ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <div className="font-medium text-orange-700">
                  Running Agents
                </div>
                <div className="text-orange-600">
                  {runningAgents.length > 0 ? runningAgents.join(", ") : "None"}
                </div>
              </div>
              <div>
                <div className="font-medium text-orange-700">
                  Progress Count
                </div>
                <div className="text-orange-600">{progress.length}</div>
              </div>
            </div>
            {error && (
              <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs">
                <strong>Error:</strong> {error}
              </div>
            )}
            {runningAgents.length > 0 && (
              <div className="mt-2">
                <div className="font-medium text-orange-700 text-xs mb-1">
                  Agent Details:
                </div>
                <div className="space-y-1">
                  {runningAgents.map((agent, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded"
                    >
                      {agent}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-4 min-h-[600px] max-h-[calc(100vh-12rem)]">
          <div className="flex flex-col gap-4 flex-1 min-w-0 lg:max-w-[66.666%]">
            <div className="flex-1 min-h-[280px] max-h-[50%]">
              <InsightsCard
                icon={Briefcase}
                title="Job Market Dashboard"
                subtitle="Roles, employers, and salary signals powering your plan"
                items={jobMarketLines}
                emptyMessage="Generate a plan to see current job market highlights."
                navigating={() => navigate("/job-market")}
                loading={sectionLoading.jobMarket}
              />
            </div>

            <div className="flex-1 min-h-[280px] max-h-[50%]">
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
          </div>

          <div className="flex-1 min-h-[400px] lg:min-h-[600px] lg:max-w-[33.333%] lg:min-w-[300px]">
            <MainChatOverlayStreaming />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
