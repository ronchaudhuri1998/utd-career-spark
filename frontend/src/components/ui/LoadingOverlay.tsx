import { useEffect, useMemo } from "react";
import { useThemeMode } from "@/contexts/ThemeContext";
import { Button } from "./button";
import ReasoningTraceGraph from "./ReasoningTraceGraph";
import { useReasoningTrace } from "@/hooks/useReasoningTrace";

export const LoadingOverlay = ({
  title,
  simulateButton,
  autoSimulate,
  fullBleed,
  className,
}: {
  title?: string;
  simulateButton?: boolean;
  autoSimulate?: boolean;
  fullBleed?: boolean;
  className?: string;
}) => {
  const { events, simulate } = useReasoningTrace();
  const { theme } = useThemeMode();
  const darkMode = theme === "ember"; // project uses "ember" as dark mode
  useEffect(() => {
    if (autoSimulate) simulate();
  }, [autoSimulate, simulate]);

  const ariaText = useMemo(() => {
    if (!events.length) return "Preparing...";
    const last = events[events.length - 1];
    return last.text || last.type;
  }, [events]);

  const containerClasses = fullBleed
    ? darkMode
      ? "relative w-full h-full rounded-xl overflow-hidden bg-black border"
      : "relative w-full h-full rounded-xl overflow-hidden bg-white border"
    : darkMode
    ? "relative w-full h-full rounded-xl overflow-hidden bg-black border"
    : "relative w-full h-full rounded-xl overflow-hidden bg-white border";

  return (
    <div className={(containerClasses + " " + (className || "")).trim()}>
      <ReasoningTraceGraph events={events} darkMode={darkMode} />
      <div
        className={
          darkMode
            ? "absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"
            : "absolute inset-0 bg-gradient-to-t from-white/70 to-transparent pointer-events-none"
        }
      />
      <div className="absolute top-2 left-3 right-3 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          {title ? (
            <span
              className={
                darkMode
                  ? "text-sm font-medium text-white drop-shadow"
                  : "text-sm font-medium text-black drop-shadow"
              }
            >
              {title}
            </span>
          ) : null}
          <span className="sr-only" aria-live="polite">
            {ariaText}
          </span>
        </div>
        {simulateButton ? (
          <Button size="sm" variant="outline" onClick={() => simulate()}>
            Simulate Loading
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default LoadingOverlay;
