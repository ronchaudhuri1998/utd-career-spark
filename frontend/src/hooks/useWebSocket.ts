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
  const [progress, setProgress] = useState<AgentProgress[]>([]);
  const [result, setResult] = useState<PlanComplete | null>(null);
  const [error, setError] = useState<string | null>(null);

  const progressRef = useRef<AgentProgress[]>([]);

  useEffect(() => {
    // Connect to WebSocket
    websocketService
      .connect()
      .then(() => {
        setIsConnected(true);
      })
      .catch((err) => {
        console.error("Failed to connect to WebSocket:", err);
        setError("Failed to connect to server");
      });

    // Set up event listeners
    const handleAgentProgress = (agentProgress: AgentProgress) => {
      progressRef.current = [...progressRef.current, agentProgress];
      setProgress([...progressRef.current]);
    };

    const handlePlanComplete = (planResult: PlanComplete) => {
      setResult(planResult);
      setIsRunning(false);
    };

    const handleError = (wsError: WebSocketError) => {
      setError(wsError.message);
      setIsRunning(false);
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
    progressRef.current = [];
  };

  return {
    isConnected,
    isRunning,
    progress,
    result,
    error,
    startPlan,
    clearProgress,
  };
};
