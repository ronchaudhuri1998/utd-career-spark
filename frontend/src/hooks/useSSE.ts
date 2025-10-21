import { useState, useRef, useCallback, useEffect } from "react";
import { generatePlan, type StreamEvent } from "@/lib/api";
import { useUserData } from "@/contexts/UserDataContext";

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
  const { setAgentOutputs, agentOutputs } = useUserData();

  // Keep ref in sync with current agentOutputs
  useEffect(() => {
    // This will be used for dashboard updates
  }, [agentOutputs]);

  // Function to update dashboard data when specific agents complete
  const updateDashboardOnAgentComplete = useCallback(
    (agent: string, output: string) => {
      console.log(`🎯 Agent ${agent} completed, updating dashboard data`);

      const currentOutputs = agentOutputs || {
        finalPlan: "",
        jobMarket: "",
        coursePlan: "",
        projectRecommendations: "",
        trace: [],
        agentcore: {
          available: false,
          status: "AgentCore session not started yet.",
          memory_id: undefined,
          memory_name: undefined,
        },
      };
      const updatedOutputs = { ...currentOutputs };

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
          console.log(`Unknown agent: ${agent}, skipping dashboard update`);
      }

      setAgentOutputs(updatedOutputs);
    },
    [setAgentOutputs, agentOutputs]
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
        console.log("🚀 Starting plan generation with SSE...", {
          goal,
          sessionId,
          isConnected,
          isRunning,
        });

        const response = await generatePlan(
          goal,
          sessionId,
          undefined, // extras
          (event: StreamEvent) => {
            console.log("📡 SSE Event received:", {
              type: event.type,
              hasText: !!event.text,
              hasData: !!event.data,
              hasSessionId: !!event.session_id,
              hasMessage: !!event.message,
              textLength: event.text?.length || 0,
              dataKeys: event.data
                ? Object.keys(event.data as Record<string, unknown>)
                : [],
              fullEvent: event,
            });

            // Handle different event types
            if (event.type === "session" && event.session_id) {
              console.log("📋 SESSION EVENT:", {
                sessionId: event.session_id,
                eventType: event.type,
              });
            } else if (event.type === "chunk" && event.text) {
              // Text chunk - this is the main response
              console.log("📝 CHUNK EVENT:", {
                textLength: event.text.length,
                textPreview:
                  event.text.substring(0, 100) +
                  (event.text.length > 100 ? "..." : ""),
                fullText: event.text,
              });
              setResponseText((prev) => {
                const newText = prev + event.text;
                console.log("📝 RESPONSE TEXT UPDATED:", {
                  previousLength: prev.length,
                  newChunkLength: event.text.length,
                  newTotalLength: newText.length,
                  newTextPreview:
                    newText.substring(0, 100) +
                    (newText.length > 100 ? "..." : ""),
                });
                return newText;
              });
            } else if (event.type === "trace" && event.data) {
              // Trace event - agent progress
              const traceData = event.data as TraceData;
              console.log("🔍 TRACE EVENT:", {
                agent: traceData.agent,
                callId: traceData.call_id,
                event: traceData.event,
                reasoning: traceData.reasoning,
                hasCollaboratorResponse: !!traceData.collaborator_response,
                collaboratorAgent: traceData.collaborator_response?.agent,
                collaboratorOutputLength:
                  traceData.collaborator_response?.output?.length || 0,
                fullTraceData: traceData,
              });

              // Extract collaborator response text from trace events
              if (
                traceData.collaborator_response &&
                traceData.collaborator_response.output
              ) {
                const collaboratorText = traceData.collaborator_response.output;
                const agent =
                  traceData.collaborator_response.agent || "Unknown";
                console.log("📝 COLLABORATOR RESPONSE FOUND:", {
                  agent,
                  textLength: collaboratorText.length,
                  textPreview: collaboratorText.substring(0, 100) + "...",
                  fullText: collaboratorText,
                });

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

                console.log(
                  "📝 CREATING COLLABORATOR PROGRESS:",
                  collaboratorProgress
                );

                const newProgress = [
                  ...progressRef.current,
                  collaboratorProgress,
                ];
                progressRef.current = newProgress;
                setProgress(newProgress);

                console.log("📝 PROGRESS UPDATED:", {
                  totalProgress: newProgress.length,
                  latestProgress: newProgress[newProgress.length - 1],
                });
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

              console.log("📝 CREATING AGENT PROGRESS:", agentProgress);

              // Add to progress
              const newProgress = [...progressRef.current, agentProgress];
              progressRef.current = newProgress;
              setProgress(newProgress);

              console.log("📝 AGENT PROGRESS UPDATED:", {
                totalProgress: newProgress.length,
                latestProgress: newProgress[newProgress.length - 1],
              });

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
              console.log("✅ DONE EVENT:", {
                eventType: event.type,
                goal,
                sessionId: sessionId || "unknown",
              });
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
              console.log("❌ ERROR EVENT:", {
                eventType: event.type,
                message: event.message,
                fullEvent: event,
              });
              throw new Error(event.message || "Unknown error occurred");
            } else {
              console.log("❓ UNKNOWN EVENT TYPE:", {
                eventType: event.type,
                fullEvent: event,
              });
            }
          }
        );

        console.log("✅ Plan generation completed successfully");
      } catch (err) {
        console.error("❌ Plan generation failed:", err);
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
