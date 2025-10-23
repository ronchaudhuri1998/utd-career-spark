import { useState, useRef, useCallback, useEffect } from "react";
import {
  generatePlan,
  type StreamEvent,
  type PlanRequestExtras,
} from "@/lib/api";
import { useUserData, type AgentOutputs } from "@/contexts/UserDataContext";

export interface AgentProgress {
  agent: string;
  call_id: string;
  event: string;
  output?: string;
  timestamp: string;
  completed?: boolean;
  status?: "started" | "progress" | "completed";
}

interface TraceData {
  agent?: string;
  call_id?: string;
  event?: string;
  reasoning?: string;
  output?: string;
  status?: string;
  collaborator_response?: {
    agent: string;
    output: string;
  };
}

export interface PlanComplete {
  goal: string;
  session_id: string;
  agentcore: {
    available: boolean;
    status: string;
    memory_id?: string;
    memory_name?: string;
  };
}

export interface UseSSEReturn {
  isConnected: boolean;
  isRunning: boolean;
  runningAgents: string[];
  progress: AgentProgress[];
  result: PlanComplete | null;
  error: string | null;
  responseText: string;
  startPlan: (goal: string, sessionId?: string) => Promise<void>;
  clearProgress: () => void;
}

export const useSSE = (): UseSSEReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runningAgents, setRunningAgents] = useState<string[]>([]);
  const [progress, setProgress] = useState<AgentProgress[]>([]);
  const [result, setResult] = useState<PlanComplete | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string>("");

  const progressRef = useRef<AgentProgress[]>([]);
  const { setAgentOutputs, agentOutputs, userData, sessionContextInitialized } =
    useUserData();

  // Function to update dashboard data when specific agents complete
  const updateDashboardOnAgentComplete = useCallback(
    (agent: string, output: string) => {
      // Use functional state update to get the latest state
      setAgentOutputs((prevOutputs: AgentOutputs) => {
        const updatedOutputs = { ...prevOutputs };

        switch (agent) {
          case "JobMarketAgent":
            updatedOutputs.jobMarket = output;
            break;
          case "CourseCatalogAgent":
            updatedOutputs.coursePlan = output;
            break;
          case "ProjectAdvisorAgent":
            updatedOutputs.projectRecommendations = output;
            break;
          case "CareerPlannerAgent":
            updatedOutputs.finalPlan = output;
            break;
          default:
            return prevOutputs; // Return unchanged state for unknown agents
        }

        return updatedOutputs;
      });
    },
    [setAgentOutputs]
  );

  const startPlan = useCallback(
    async (goal: string, sessionId?: string) => {
      setIsRunning(true);
      setError(null);
      setResult(null);
      setProgress([]);
      setRunningAgents([]);
      progressRef.current = [];

      try {
        // Build user context like runAgentWorkflow does
        const extras: PlanRequestExtras = {
          user_name: userData.name,
          user_email: userData.email,
          user_phone: userData.phone,
          user_location: userData.location,
          user_major: userData.major,
          graduation_year: userData.graduationYear,
          gpa: userData.gpa,
          career_goal: userData.careerGoal,
          student_year: userData.studentYear || userData.graduationYear || "",
          courses_taken: userData.coursesTaken || "",
          time_commitment: userData.timeCommitment || "",
          skills: userData.skills.join(", "),
          experience: JSON.stringify(userData.experience),
          // Legacy fields for backward compatibility
          about: userData.careerGoal || "",
          contact_email: userData.email || "",
        };

        // Debug logging for user context
        console.log("🔧 USER CONTEXT DEBUG:");
        console.log("   sessionContextInitialized:", sessionContextInitialized);
        console.log("   userData.name:", userData.name);
        console.log("   userData.email:", userData.email);
        console.log("   userData.major:", userData.major);
        console.log("   Built extras:", extras);
        console.log("   Will send context:", !sessionContextInitialized);

        const response = await generatePlan(
          goal,
          sessionId,
          sessionContextInitialized ? undefined : extras, // Only send context on first message
          (event: StreamEvent) => {
            // Handle different event types
            if (event.type === "session" && event.session_id) {
              // Session event
            } else if (event.type === "chunk" && event.text) {
              // Text chunk - this is the main response
              setResponseText((prev) => {
                return prev + event.text;
              });
            } else if (event.type === "trace" && event.data) {
              // Trace event - agent progress
              const traceData = event.data as TraceData;

              // Extract collaborator response text from trace events
              if (
                traceData.collaborator_response &&
                traceData.collaborator_response.output
              ) {
                const collaboratorText = traceData.collaborator_response.output;
                const agent =
                  traceData.collaborator_response.agent || "Unknown";

                // Update dashboard data immediately with collaborator response
                updateDashboardOnAgentComplete(agent, collaboratorText);

                // Add collaborator response to the progress data so useChatMessages can handle it
                const collaboratorProgress: AgentProgress = {
                  agent: agent,
                  call_id: "collaborator-response",
                  event: "Collaborator response received",
                  output: collaboratorText,
                  timestamp: new Date().toISOString(),
                  completed: true,
                  status: "completed",
                };

                const newProgress = [
                  ...progressRef.current,
                  collaboratorProgress,
                ];
                progressRef.current = newProgress;
                setProgress(newProgress);
              }

              // Convert trace data to AgentProgress format
              const agentProgress: AgentProgress = {
                agent: traceData.agent || "Unknown",
                call_id: traceData.call_id || "no-call-id",
                event:
                  traceData.event || traceData.reasoning || "Processing...",
                output: traceData.output,
                timestamp: new Date().toISOString(),
                completed: traceData.status === "completed",
                status:
                  (traceData.status as "started" | "progress" | "completed") ||
                  "progress",
              };

              // Add to progress
              const newProgress = [...progressRef.current, agentProgress];
              progressRef.current = newProgress;
              setProgress(newProgress);

              // Handle agent status changes
              const agent = agentProgress.agent;

              if (agentProgress.status === "started") {
                setRunningAgents((prev) => {
                  if (!prev.includes(agent)) {
                    return [...prev, agent];
                  }
                  return prev;
                });
              } else if (
                agentProgress.status === "completed" ||
                agentProgress.completed
              ) {
                setRunningAgents((prev) => prev.filter((a) => a !== agent));

                // Update dashboard data when agent completes
                if (agentProgress.output) {
                  updateDashboardOnAgentComplete(agent, agentProgress.output);
                }
              }
            } else if (event.type === "done") {
              setIsRunning(false);
              setRunningAgents([]);

              // Create a mock PlanComplete result
              setResult({
                goal,
                session_id: sessionId || "unknown",
                agentcore: {
                  available: true,
                  status: "Plan generation completed",
                  memory_id: sessionId,
                  memory_name: `Session ${sessionId}`,
                },
              });
            } else if (event.type === "error") {
              throw new Error(event.message || "Unknown error occurred");
            }
          }
        );
      } catch (err) {
        console.error("Plan generation failed:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setIsRunning(false);
        setRunningAgents([]);
      }
    },
    [updateDashboardOnAgentComplete, isConnected, isRunning]
  );

  const clearProgress = useCallback(() => {
    setProgress([]);
    setResult(null);
    setError(null);
    setRunningAgents([]);
    setResponseText("");
    progressRef.current = [];
  }, []);

  // Set connected to true when hook is used (SSE is always available)
  useEffect(() => {
    setIsConnected(true);
  }, []);

  return {
    isConnected,
    isRunning,
    runningAgents,
    progress,
    result,
    error,
    responseText,
    startPlan,
    clearProgress,
  };
};
