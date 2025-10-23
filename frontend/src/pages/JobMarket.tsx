import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, Briefcase, TestTube2 } from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";
import { validateJobMarketData } from "@/types/jobMarket";
import { JobListings } from "@/components/job-market/JobListings";
import { InsightCards } from "@/components/job-market/InsightCards";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { mockJobMarketData } from "@/data/mockJobMarketData";
import { toast } from "sonner";
import ChatPopup from "@/components/chat/ChatPopup";

const JobMarket = () => {
  const navigate = useNavigate();
  const { userData, agentOutputs, sectionLoading, setAgentOutputs } =
    useUserData();

  // Validate and parse job market data
  const parsedData = useMemo(() => {
    if (!agentOutputs.jobMarket) return null;
    return validateJobMarketData(agentOutputs.jobMarket);
  }, [agentOutputs.jobMarket]);

  const loadMockData = () => {
    setAgentOutputs({
      ...agentOutputs,
      jobMarket: mockJobMarketData,
    });
    toast.success("Mock job market data loaded successfully!");
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
              <Briefcase className="w-5 h-5 text-primary" />
              Job Market Overview
            </h1>
            <p className="text-sm text-muted-foreground">
              Personalized market signals for{" "}
              {userData.careerGoal || "your goal"}
            </p>
          </div>
          <Badge
            variant={sectionLoading.jobMarket ? "secondary" : "outline"}
            className="ml-auto"
          >
            {sectionLoading.jobMarket ? "Refreshing" : "Updated"}
          </Badge>
        </div>
      </header>

      <main className="w-full px-6 py-8">
        {!agentOutputs.jobMarket ? (
          <Card className="border-2">
            <CardContent className="py-12 text-center space-y-4">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  No Job Market Data
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Run the onboarding flow to fetch live job market insights
                  tailored to your goal.
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
          <div className="space-y-6">
            {/* Chat Button */}
            <div className="flex justify-end">
              <ChatPopup
                title="Job Market Assistant"
                dashboardType="jobmarket"
              />
            </div>

            {/* Dashboard Content */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Job Listings */}
              <div>
                <JobListings listings={parsedData.listings} />
              </div>

              {/* Key Insights */}
              <div>
                <InsightCards insights={parsedData.insights} />
              </div>
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
                    The job market data could not be parsed into the interactive
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
                <CardTitle className="text-lg">Job Market Insights</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Unable to parse data into interactive dashboard format.
                </p>
              </CardHeader>
              <CardContent>
                <div className="border border-primary/20 bg-primary/5 rounded-xl p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                    {agentOutputs.jobMarket}
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

export default JobMarket;
