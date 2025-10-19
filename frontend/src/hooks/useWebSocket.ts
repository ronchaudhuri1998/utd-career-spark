import { useEffect, useRef, useState } from "react";
import {
  websocketService,
  AgentProgress,
  PlanComplete,
  WebSocketError,
} from "@/lib/websocket";

export interface UseWebSocketReturn {
  isConnected: boolean;
  isRunning: boolean;
  runningAgents: string[];
  progress: AgentProgress[];
  result: PlanComplete | null;
  error: string | null;
  startPlan: (
    goal: string,
    sessionId?: string,
    extraContext?: Record<string, string>
  ) => void;
  clearProgress: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runningAgents, setRunningAgents] = useState<string[]>([]);
  const [progress, setProgress] = useState<AgentProgress[]>([]);
  const [result, setResult] = useState<PlanComplete | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progressRef = useRef<AgentProgress[]>([]);

  useEffect(() => {
    // Connect to WebSocket
    console.log("🔌 WebSocket - Attempting connection...");
    websocketService
      .connect()
      .then(() => {
        console.log("🟢 WebSocket - Connected successfully");
        setIsConnected(true);
      })
      .catch((err) => {
        console.error("🔴 WebSocket - Connection failed:", err);
        setError("Failed to connect to server");
      });

    // Set up event listeners
    const handleAgentProgress = (agentProgress: AgentProgress) => {
      console.log("🔵 WebSocket Event - Agent Progress:", {
        agent: agentProgress.agent,
        event: agentProgress.event,
        status: agentProgress.status,
        completed: agentProgress.completed,
        hasOutput: !!agentProgress.output,
        timestamp: agentProgress.timestamp,
      });

      progressRef.current = [...progressRef.current, agentProgress];
      setProgress([...progressRef.current]);

      // Handle agent status changes
      const agent = agentProgress.agent;

      if (agentProgress.status === "started") {
        console.log("🟢 Agent Started:", agent);
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
        console.log(
          "🔴 Agent Completed:",
          agent,
          "- Event:",
          agentProgress.event
        );
        setRunningAgents((prev) => prev.filter((a) => a !== agent));
      }
    };

    const handlePlanComplete = (planResult: PlanComplete) => {
      console.log("✅ WebSocket Event - Plan Complete:", {
        goal: planResult.goal,
        sessionId: planResult.session_id,
        hasTrace: planResult.trace?.length || 0,
        hasFinalPlan: !!planResult.final_plan,
      });
      setResult(planResult);
      setIsRunning(false);
      setRunningAgents([]); // Clear all running agents when plan completes
    };

    const handleError = (wsError: WebSocketError) => {
      console.log("❌ WebSocket Event - Error:", wsError.message);
      setError(wsError.message);
      setIsRunning(false);
      setRunningAgents([]); // Clear all running agents on error
    };

    websocketService.onAgentProgress(handleAgentProgress);
    websocketService.onPlanComplete(handlePlanComplete);
    websocketService.onError(handleError);

    // Cleanup on unmount
    return () => {
      websocketService.offAgentProgress(handleAgentProgress);
      websocketService.offPlanComplete(handlePlanComplete);
      websocketService.offError(handleError);
      websocketService.disconnect();
    };
  }, []);

  const startPlan = (
    goal: string,
    sessionId?: string,
    extraContext?: Record<string, string>
  ) => {
    if (!isConnected) {
      setError("Not connected to server");
      return;
    }

    // Reset state
    setProgress([]);
    setResult(null);
    setError(null);
    setIsRunning(true);
    setRunningAgents([]); // Start with no running agents
    progressRef.current = [];

    // Start the plan
    try {
      websocketService.startPlan(goal, sessionId, extraContext);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start plan");
      setIsRunning(false);
    }
  };

  const clearProgress = () => {
    setProgress([]);
    setResult(null);
    setError(null);
    setIsRunning(false);
    setRunningAgents([]);
    progressRef.current = [];
  };

  return {
    isConnected,
    isRunning,
    runningAgents,
    progress,
    result,
    error,
    startPlan,
    clearProgress,
  };
};
