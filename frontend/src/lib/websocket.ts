import { io, Socket } from "socket.io-client";

export interface AgentProgress {
  agent: string;
  call_id: string;
  event: string;
  output?: string;
  timestamp: string;
  completed?: boolean;
  status?: "started" | "progress" | "completed";
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
  trace: AgentProgress[];
  final_plan: string;
  job_market: string;
  course_plan: string;
  project_recommendations: string;
}

export interface WebSocketError {
  message: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const API_BASE_URL =
        (import.meta.env.VITE_API_URL as string | undefined)?.replace(
          /\/$/,
          ""
        ) || "http://127.0.0.1:5000";

      this.socket = io(API_BASE_URL, {
        transports: ["websocket", "polling"],
        autoConnect: true,
      });

      this.socket.on("connect", () => {
        this.isConnected = true;
        console.log("WebSocket connected");
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
        reject(error);
      });

      this.socket.on("disconnect", () => {
        this.isConnected = false;
        console.log("WebSocket disconnected");
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  startPlan(
    goal: string,
    sessionId?: string,
    extraContext?: Record<string, string>
  ) {
    if (!this.socket || !this.isConnected) {
      throw new Error("WebSocket not connected");
    }

    this.socket.emit("start_plan", {
      goal,
      session_id: sessionId,
      extra_context: extraContext,
    });
  }

  onAgentProgress(callback: (progress: AgentProgress) => void) {
    if (!this.socket) return;
    this.socket.on("agent_progress", callback);
  }

  onPlanComplete(callback: (result: PlanComplete) => void) {
    if (!this.socket) return;
    this.socket.on("plan_complete", callback);
  }

  onError(callback: (error: WebSocketError) => void) {
    if (!this.socket) return;
    this.socket.on("error", callback);
  }

  offAgentProgress(callback?: (progress: AgentProgress) => void) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off("agent_progress", callback);
    } else {
      this.socket.off("agent_progress");
    }
  }

  offPlanComplete(callback?: (result: PlanComplete) => void) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off("plan_complete", callback);
    } else {
      this.socket.off("plan_complete");
    }
  }

  offError(callback?: (error: WebSocketError) => void) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off("error", callback);
    } else {
      this.socket.off("error");
    }
  }

  get connected() {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();
