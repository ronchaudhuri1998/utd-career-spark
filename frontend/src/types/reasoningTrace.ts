export type TraceEventType = "start" | "reasoning" | "graph_call" | "end";

export interface TraceEvent {
  id: string;
  type: TraceEventType;
  text?: string;
  ts: number;
}

export const EVENT_COLORS: Record<TraceEventType, string> = {
  start: "#3B82F6", // blue
  reasoning: "#F97316", // orange
  graph_call: "#EC4899", // pink
  end: "#22C55E", // green
};

export interface TraceModel {
  events: TraceEvent[];
}

export const createEvent = (
  type: TraceEventType,
  text?: string,
  ts: number = Date.now()
): TraceEvent => ({
  id: `${type}-${ts}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  text,
  ts,
});
