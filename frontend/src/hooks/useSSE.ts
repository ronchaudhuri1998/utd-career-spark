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
  toolCalls?: Array<{
    type: string;
    name: string;
    result: string;
    status?: "calling" | "completed" | "failed";
    function?: string;
    parameters?: Record<string, any>;
    execution_time_ms?: number;
    api_path?: string;
    verb?: string;
    trace_id?: string;
    client_request_id?: string;
    response?: string;
    query?: string;
    references_count?: number;
  }>;
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
  tool_calls?: Array<{
    type: string;
    name: string;
    result: string;
    status?: "calling" | "completed" | "failed";
    function?: string;
    parameters?: Record<string, any>;
    execution_time_ms?: number;
    api_path?: string;
    verb?: string;
    trace_id?: string;
    client_request_id?: string;
    response?: string;
    query?: string;
    references_count?: number;
  }>;
  supervisor_id?: string;
  agent_call_id?: string;
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
    agentCards.forEach((card) => {
      if (card.status === "working") {
        // Use card.agent (friendly name) not the map key (call_id)
        agents.push(card.agent);
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
                const cardKey = data.agent_call_id || agentName;
                setAgentCards((prev) => {
                  const newMap = new Map(prev);
                  const existing = newMap.get(cardKey);
                  if (existing) {
                    newMap.set(cardKey, {
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
                const cardKey = data.agent_call_id || agentName;
                setAgentCards((prev) => {
                  const newMap = new Map(prev);
                  newMap.set(cardKey, {
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

                // Group supervisor reasoning by supervisor_id, create individual cards for collaborators
                if (agentName === "Supervisor" && data.supervisor_id) {
                  setAgentCards((prev) => {
                    const newMap = new Map(prev);
                    const existing = newMap.get(data.supervisor_id);
                    if (existing) {
                      newMap.set(data.supervisor_id, {
                        ...existing,
                        reasoningItems: [
                          ...existing.reasoningItems,
                          data.reasoning!,
                        ],
                      });
                    } else {
                      newMap.set(data.supervisor_id, {
                        agent: "Supervisor",
                        status: "working",
                        reasoningItems: [data.reasoning!],
                        output: null,
                        startTime: Date.now(),
                      });
                    }
                    return newMap;
                  });
                } else if (agentName !== "Supervisor") {
                  // Create individual cards for collaborators
                  const cardKey = data.agent_call_id || agentName;
                  setAgentCards((prev) => {
                    const newMap = new Map(prev);
                    const existing = newMap.get(cardKey);
                    if (existing) {
                      newMap.set(cardKey, {
                        ...existing,
                        reasoningItems: [
                          ...existing.reasoningItems,
                          data.reasoning!,
                        ],
                      });
                    } else {
                      newMap.set(cardKey, {
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
              }

              // Handle tool calls - add detailed tool call entries immediately
              if (data.tool_calls && data.tool_calls.length > 0) {
                const agentName = data.agent?.includes("Collaborator:")
                  ? data.agent.replace("Collaborator: ", "")
                  : data.agent || "Supervisor";

                // Group supervisor tool calls by supervisor_id, create individual cards for collaborators
                if (agentName === "Supervisor" && data.supervisor_id) {
                  setAgentCards((prev) => {
                    const newMap = new Map(prev);
                    const existing = newMap.get(data.supervisor_id);
                    if (existing) {
                      newMap.set(data.supervisor_id, {
                        ...existing,
                        toolCalls: [
                          ...(existing.toolCalls || []),
                          ...data.tool_calls!,
                        ],
                      });
                    } else {
                      newMap.set(data.supervisor_id, {
                        agent: "Supervisor",
                        status: "working",
                        reasoningItems: existing?.reasoningItems || [],
                        output: null,
                        startTime: Date.now(),
                        toolCalls: data.tool_calls!,
                      });
                    }
                    return newMap;
                  });
                } else if (agentName !== "Supervisor") {
                  // Create individual cards for collaborators
                  const cardKey = data.agent_call_id || agentName;
                  setAgentCards((prev) => {
                    const newMap = new Map(prev);
                    const existing = newMap.get(cardKey);
                    if (existing) {
                      newMap.set(cardKey, {
                        ...existing,
                        toolCalls: [
                          ...(existing.toolCalls || []),
                          ...data.tool_calls!,
                        ],
                      });
                    } else {
                      newMap.set(cardKey, {
                        agent: agentName,
                        status: "working",
                        reasoningItems: existing?.reasoningItems || [],
                        output: null,
                        startTime: Date.now(),
                        toolCalls: data.tool_calls!,
                      });
                    }
                    return newMap;
                  });
                }
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

                // Group supervisor updates by supervisor_id, create individual cards for collaborators
                if (agentName === "Supervisor" && data.supervisor_id) {
                  setAgentCards((prev) => {
                    const newMap = new Map(prev);
                    const existing = newMap.get(data.supervisor_id);

                    if (existing) {
                      // Update existing supervisor
                      newMap.set(data.supervisor_id, {
                        ...existing,
                        status:
                          data.status === "started" ||
                          data.status === "progress"
                            ? "working"
                            : existing.status,
                        reasoningItems: data.reasoning
                          ? [...existing.reasoningItems, data.reasoning]
                          : existing.reasoningItems,
                      });
                    } else {
                      // Create new supervisor for any supervisor with progress status
                      newMap.set(data.supervisor_id, {
                        agent: "Supervisor",
                        status:
                          data.status === "started" ||
                          data.status === "progress"
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
                } else if (agentName !== "Supervisor") {
                  // Create individual cards for collaborators
                  const cardKey = data.agent_call_id || agentName;
                  setAgentCards((prev) => {
                    const newMap = new Map(prev);
                    const existing = newMap.get(cardKey);

                    if (existing) {
                      // Update existing agent
                      newMap.set(cardKey, {
                        ...existing,
                        status:
                          data.status === "started" ||
                          data.status === "progress"
                            ? "working"
                            : existing.status,
                        reasoningItems: data.reasoning
                          ? [...existing.reasoningItems, data.reasoning]
                          : existing.reasoningItems,
                      });
                    } else {
                      // Create new agent for any agent with progress status
                      newMap.set(cardKey, {
                        agent: agentName,
                        status:
                          data.status === "started" ||
                          data.status === "progress"
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
              }
            } else if (event.type === "done") {
              setIsRunning(false);

              // Mark supervisor as completed using supervisor_id
              const supervisorId = `supervisor_${sessionId}`;
              setAgentCards((prev) => {
                const newMap = new Map(prev);
                const supervisor = newMap.get(supervisorId);
                if (supervisor) {
                  newMap.set(supervisorId, {
                    ...supervisor,
                    status: "completed",
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
