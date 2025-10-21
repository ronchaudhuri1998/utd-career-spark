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
  "http://127.0.0.1:8000";

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

export interface StreamEvent {
  type: "session" | "chunk" | "trace" | "done" | "error";
  session_id?: string;
  text?: string;
  data?: unknown;
  message?: string;
}

export async function generatePlan(
  goal: string,
  sessionId?: string,
  extras?: PlanRequestExtras,
  onProgress?: (event: StreamEvent) => void
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

  console.log("🌐 Making SSE request to:", `${API_BASE_URL}/api/plan`);
  console.log("🌐 Request payload:", payload);

  const response = await fetch(`${API_BASE_URL}/api/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log("🌐 SSE Response status:", response.status);
  console.log(
    "🌐 SSE Response headers:",
    Object.fromEntries(response.headers.entries())
  );

  if (!response.ok) {
    throw new Error(`Failed to generate plan: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  console.log("🌐 SSE Response body available, starting to read stream...");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let resultSessionId = sessionId || "";
  let fullText = "";
  const traces: unknown[] = [];
  let buffer = "";

  try {
    console.log("🌐 Starting SSE stream reading loop...");
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("🌐 SSE stream completed, total chunks read:", chunkCount);
        break;
      }

      chunkCount++;
      const decodedChunk = decoder.decode(value, { stream: true });
      console.log("🌐 SSE Chunk #" + chunkCount + ":", {
        length: decodedChunk.length,
        preview:
          decodedChunk.substring(0, 100) +
          (decodedChunk.length > 100 ? "..." : ""),
        fullChunk: decodedChunk,
      });

      buffer += decodedChunk;
      const lines = buffer.split("\n");

      // Keep last incomplete line in buffer
      buffer = lines.pop() || "";

      console.log("🌐 Processing lines:", lines.length, "lines from chunk");

      for (const line of lines) {
        console.log("🌐 Processing line:", line);

        if (line.startsWith("data: ")) {
          try {
            const eventData = line.slice(6);
            console.log("🌐 Parsing event data:", eventData);

            const event: StreamEvent = JSON.parse(eventData);
            console.log("🌐 Parsed SSE event:", event);

            if (event.type === "session" && event.session_id) {
              resultSessionId = event.session_id;
            } else if (event.type === "chunk" && event.text) {
              fullText += event.text;
            } else if (event.type === "trace" && event.data) {
              traces.push(event.data);
            } else if (event.type === "error") {
              throw new Error(event.message || "Stream error");
            }

            // Call progress callback
            if (onProgress) {
              console.log("🌐 Calling onProgress with event:", event);
              onProgress(event);
            } else {
              console.log("🌐 No onProgress callback provided");
            }
          } catch (e) {
            console.warn("🌐 Failed to parse SSE event:", line, e);
          }
        } else if (line.trim()) {
          console.log("🌐 Non-data line:", line);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    goal,
    session_id: resultSessionId,
    final_plan: fullText,
    trace: traces,
  };
}

/**
 * Send follow-up questions using the same session_id.
 * This routes through the supervisor agent which decides whether to
 * answer directly or call collaborator agents.
 */
export async function sendChatMessage(
  request: ChatRequest,
  onProgress?: (event: StreamEvent) => void
): Promise<ChatResponse> {
  // Route through generatePlan with the same session
  const result = await generatePlan(
    request.message,
    request.sessionId,
    undefined,
    onProgress
  );

  return {
    reply: result.final_plan || "",
    session_id: result.session_id,
  };
}

export interface AgentCoreStatus {
  agents_configured: boolean;
  planner_id: string | null;
  planner_alias_id: string | null;
  region: string;
}

export async function getAgentCoreStatus(): Promise<AgentCoreStatus> {
  const response = await fetch(`${API_BASE_URL}/api/status`);
  if (!response.ok) {
    throw new Error(`Status check failed: ${response.statusText}`);
  }
  return (await response.json()) as AgentCoreStatus;
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
