export interface AgentWorkflowResponse {
  goal: string;
  session_id: string;
  agentcore?: {
    available: boolean;
    status: string;
    memory_id?: string | null;
    memory_name?: string | null;
  };
  trace?: Array<{ agent: string; event: string; output?: string }>;
  final_plan?: string;
  job_market?: string;
  course_plan?: string;
  project_recommendations?: string;
}

export interface IntroResponse {
  message: string;
  session_id: string;
  agentcore?: AgentWorkflowResponse["agentcore"];
}

export interface PlanRequestExtras {
  student_year?: string;
  courses_taken?: string;
  about?: string;
  time_commitment?: string;
  contact_email?: string;
}

export interface ChatRequest {
  message: string;
  goal: string;
  sessionId?: string;
  history?: Array<{ role: "user" | "assistant"; text: string }>;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
  agentcore?: AgentWorkflowResponse["agentcore"];
}

export interface StatusResponse {
  available: boolean;
  status: string;
  memory_id?: string | null;
  memory_name?: string | null;
}

export interface ProcessCareerGoalResponse {
  original_goal: string;
  processed_goal: string;
  agentcore?: AgentWorkflowResponse["agentcore"];
}

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://127.0.0.1:5000";

export async function requestIntro(
  goal: string,
  sessionId?: string
): Promise<IntroResponse> {
  const payload: Record<string, unknown> = { goal };
  if (sessionId) {
    payload.session_id = sessionId;
  }

  const response = await fetch(`${API_BASE_URL}/api/intro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data?.error === "string" ? data.error : response.statusText;
    throw new Error(message || "Failed to generate plan");
  }
  return data as IntroResponse;
}

export async function generatePlan(
  goal: string,
  sessionId?: string,
  extras?: PlanRequestExtras
): Promise<AgentWorkflowResponse> {
  const payload: Record<string, unknown> = { goal };
  if (sessionId) {
    payload.session_id = sessionId;
  }
  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      if (value) {
        payload[key] = value;
      }
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data?.error === "string" ? data.error : response.statusText;
    throw new Error(message || "Failed to generate plan");
  }

  return data as AgentWorkflowResponse;
}

export async function sendChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  const payload: Record<string, unknown> = {
    message: request.message,
    goal: request.goal,
  };
  if (request.sessionId) {
    payload.session_id = request.sessionId;
  }
  if (request.history) {
    payload.history = request.history;
  }

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data?.error === "string" ? data.error : response.statusText;
    throw new Error(message || "Chat request failed");
  }

  return data as ChatResponse;
}

export async function getAgentCoreStatus(): Promise<StatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/status`);
  if (!response.ok) {
    throw new Error(`Status check failed: ${response.statusText}`);
  }
  return (await response.json()) as StatusResponse;
}

export async function processCareerGoal(
  goal: string
): Promise<ProcessCareerGoalResponse> {
  const response = await fetch(`${API_BASE_URL}/api/process-career-goal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data?.error === "string" ? data.error : response.statusText;
    throw new Error(message || "Failed to process career goal");
  }

  return data as ProcessCareerGoalResponse;
}
