import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  generatePlan,
  type StreamEvent,
  type PlanRequestExtras,
} from "@/lib/api";
import { useUserData, type AgentOutputs } from "@/contexts/UserDataContext";

export interface AgentCard {
  agent: string;
  status: "working" | "completed";
  reasoningItems: string[];
  output: string | null;
  startTime: number;
}

interface TraceData {
  agent?: string;
  status?: string;
  reasoning?: string;
  calling_collaborator?: string;
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
  agentCards: Map<string, AgentCard>;
  result: PlanComplete | null;
  error: string | null;
  responseText: string;
  startPlan: (goal: string, sessionId?: string) => Promise<void>;
  clearProgress: () => void;
}

export const useSSE = (): UseSSEReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [agentCards, setAgentCards] = useState<Map<string, AgentCard>>(
    new Map()
  );
  const [result, setResult] = useState<PlanComplete | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string>("");

  // Derive runningAgents from agentCards
  const runningAgents = useMemo(() => {
    const agents: string[] = [];
    agentCards.forEach((card, agentName) => {
      if (card.status === "working") {
        agents.push(agentName);
      }
    });
    return agents;
  }, [agentCards]);

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
      setAgentCards(new Map());

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
              const data = event.data as TraceData;

              // Skip empty progress events (no reasoning, no collaborator_response, no agent)
              if (
                !data.reasoning &&
                !data.collaborator_response &&
                !data.calling_collaborator &&
                !data.agent
              ) {
                return;
              }

              // Handle collaborator completion
              if (data.collaborator_response) {
                const agentName = data.collaborator_response.agent;
                setAgentCards((prev) => {
                  const newMap = new Map(prev);
                  const existing = newMap.get(agentName);
                  if (existing) {
                    newMap.set(agentName, {
                      ...existing,
                      status: "completed",
                      output: data.collaborator_response!.output,
                    });
                  }
                  return newMap;
                });
                updateDashboardOnAgentComplete(
                  agentName,
                  data.collaborator_response.output
                );
                return;
              }

              // Handle supervisor calling collaborator
              if (data.calling_collaborator) {
                const agentName = data.calling_collaborator;
                setAgentCards((prev) => {
                  const newMap = new Map(prev);
                  newMap.set(agentName, {
                    agent: agentName,
                    status: "working",
                    reasoningItems: [`Calling ${agentName}...`],
                    output: null,
                    startTime: Date.now(),
                  });
                  return newMap;
                });
                return;
              }

              // Handle reasoning updates (supervisor or collaborator)
              if (data.reasoning) {
                const agentName = data.agent?.includes("Collaborator:")
                  ? data.agent.replace("Collaborator: ", "")
                  : data.agent || "Supervisor";

                setAgentCards((prev) => {
                  const newMap = new Map(prev);
                  const existing = newMap.get(agentName);
                  if (existing) {
                    newMap.set(agentName, {
                      ...existing,
                      reasoningItems: [
                        ...existing.reasoningItems,
                        data.reasoning!,
                      ],
                    });
                  } else {
                    newMap.set(agentName, {
                      agent: agentName,
                      status: "working",
                      reasoningItems: [data.reasoning!],
                      output: null,
                      startTime: Date.now(),
                    });
                  }
                  return newMap;
                });
              }

              // Handle basic agent status updates (what the backend actually sends)
              if (
                data.agent &&
                !data.collaborator_response &&
                !data.calling_collaborator
              ) {
                const agentName = data.agent.includes("Collaborator:")
                  ? data.agent.replace("Collaborator: ", "")
                  : data.agent;
                setAgentCards((prev) => {
                  const newMap = new Map(prev);
                  const existing = newMap.get(agentName);

                  if (existing) {
                    // Update existing agent
                    newMap.set(agentName, {
                      ...existing,
                      status:
                        data.status === "started" || data.status === "progress"
                          ? "working"
                          : existing.status,
                      reasoningItems: data.reasoning
                        ? [...existing.reasoningItems, data.reasoning]
                        : existing.reasoningItems,
                    });
                  } else {
                    // Create new agent for any agent with progress status
                    newMap.set(agentName, {
                      agent: agentName,
                      status:
                        data.status === "started" || data.status === "progress"
                          ? "working"
                          : "working",
                      reasoningItems: data.reasoning
                        ? [data.reasoning]
                        : ["Working..."],
                      output: null,
                      startTime: Date.now(),
                    });
                  }

                  return newMap;
                });
              }
            } else if (event.type === "done") {
              setIsRunning(false);

              // Mark Supervisor as completed
              setAgentCards((prev) => {
                const newMap = new Map(prev);
                const supervisor = newMap.get("Supervisor");
                if (supervisor) {
                  newMap.set("Supervisor", {
                    ...supervisor,
                    status: "completed",
                  });
                } else {
                  // Create Supervisor card if it doesn't exist (in case no reasoning was sent)
                  newMap.set("Supervisor", {
                    agent: "Supervisor",
                    status: "completed",
                    reasoningItems: ["Plan generation completed"],
                    output: null,
                    startTime: Date.now(),
                  });
                }
                return newMap;
              });

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
      }
    },
    [
      updateDashboardOnAgentComplete,
      sessionContextInitialized,
      userData.careerGoal,
      userData.coursesTaken,
      userData.email,
      userData.experience,
      userData.gpa,
      userData.graduationYear,
      userData.location,
      userData.major,
      userData.name,
      userData.phone,
      userData.skills,
      userData.studentYear,
      userData.timeCommitment,
    ]
  );

  const clearProgress = useCallback(() => {
    setAgentCards(new Map());
    setResult(null);
    setError(null);
    setResponseText("");
  }, []);

  // Set connected to true when hook is used (SSE is always available)
  useEffect(() => {
    setIsConnected(true);
  }, []);

  return {
    isConnected,
    isRunning,
    runningAgents,
    agentCards,
    result,
    error,
    responseText,
    startPlan,
    clearProgress,
  };
};
