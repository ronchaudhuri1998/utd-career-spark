import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSSEContext } from "@/contexts/SSEContext";
import {
  createEvent,
  EVENT_COLORS,
  TraceEvent,
  TraceEventType,
} from "@/types/reasoningTrace";

export interface UseReasoningTraceReturn {
  events: TraceEvent[];
  pushEvent: (e: TraceEvent) => void;
  clear: () => void;
  simulate: (opts?: { speedMs?: number; steps?: number }) => void;
}

// Lightweight mapper from existing SSE agentCards to trace events
const mapSSEToTrace = (
  prev: TraceEvent[],
  update: {
    type: TraceEventType;
    text?: string;
  }
): TraceEvent[] => {
  const next = createEvent(update.type, update.text);
  return [...prev, next];
};

export const useReasoningTrace = (): UseReasoningTraceReturn => {
  const { isRunning, agentCards } = useSSEContext();
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const simTimerRef = useRef<number | null>(null);

  // Observe high-level running state to inject start/end markers
  const lastRunningRef = useRef<boolean>(false);
  useEffect(() => {
    if (isRunning && !lastRunningRef.current) {
      setEvents((prev) =>
        mapSSEToTrace(prev, { type: "start", text: "Session started" })
      );
    }
    if (!isRunning && lastRunningRef.current) {
      setEvents((prev) =>
        mapSSEToTrace(prev, { type: "end", text: "Session completed" })
      );
    }
    lastRunningRef.current = isRunning;
  }, [isRunning]);

  // Watch agentCards for reasoning and tool calls
  const cardsSnapshot = useMemo(
    () => Array.from(agentCards.values()),
    [agentCards]
  );
  const lastCountsRef = useRef<{
    reasoningByAgent: Record<string, number>;
    toolCallsByAgent: Record<string, number>;
  }>({
    reasoningByAgent: {},
    toolCallsByAgent: {},
  });

  useEffect(() => {
    const reasoningByAgent: Record<string, number> = {};
    const toolCallsByAgent: Record<string, number> = {};

    for (const card of cardsSnapshot) {
      const rLen = card.reasoningItems.length;
      const tLen = (card.toolCalls || []).length;
      reasoningByAgent[card.agent] = rLen;
      toolCallsByAgent[card.agent] = tLen;
    }

    // Compare to previous and emit deltas
    for (const card of cardsSnapshot) {
      const prevR = lastCountsRef.current.reasoningByAgent[card.agent] || 0;
      const prevT = lastCountsRef.current.toolCallsByAgent[card.agent] || 0;
      const curR = reasoningByAgent[card.agent] || 0;
      const curT = toolCallsByAgent[card.agent] || 0;

      if (curR > prevR) {
        const newText = card.reasoningItems.slice(prevR).join("\n");
        setEvents((prev) =>
          mapSSEToTrace(prev, { type: "reasoning", text: newText })
        );
      }
      if (curT > prevT) {
        const calls = (card.toolCalls || []).slice(prevT);
        const text = calls
          .map((c) => `${c.name || c.type || "tool"}`)
          .join(", ");
        setEvents((prev) => mapSSEToTrace(prev, { type: "graph_call", text }));
      }
    }

    lastCountsRef.current = { reasoningByAgent, toolCallsByAgent };
  }, [cardsSnapshot]);

  const pushEvent = useCallback((e: TraceEvent) => {
    setEvents((prev) => [...prev, e]);
  }, []);

  const clear = useCallback(() => {
    setEvents([]);
  }, []);

  const simulate = useCallback(
    (opts?: { speedMs?: number; steps?: number }) => {
      const speed = Math.max(50, Math.min(1000, opts?.speedMs ?? 220));
      const steps = Math.max(4, Math.min(40, opts?.steps ?? 12));

      if (simTimerRef.current) {
        window.clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }

      setEvents([createEvent("start", "Simulated start")]);

      let i = 0;
      simTimerRef.current = window.setInterval(() => {
        i += 1;
        if (i >= steps - 1) {
          setEvents((prev) =>
            mapSSEToTrace(prev, { type: "end", text: "Simulated end" })
          );
          if (simTimerRef.current) window.clearInterval(simTimerRef.current);
          simTimerRef.current = null;
          return;
        }
        // sprinkle graph_call occasionally
        if (i % 3 === 0) {
          setEvents((prev) =>
            mapSSEToTrace(prev, { type: "graph_call", text: "Service call" })
          );
        } else {
          setEvents((prev) =>
            mapSSEToTrace(prev, { type: "reasoning", text: "Thinking..." })
          );
        }
      }, speed);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (simTimerRef.current) window.clearInterval(simTimerRef.current);
    };
  }, []);

  return { events, pushEvent, clear, simulate };
};
