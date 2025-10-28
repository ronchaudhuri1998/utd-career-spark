import { useEffect, useMemo, useRef } from "react";
import { EVENT_COLORS, TraceEvent } from "@/types/reasoningTrace";

interface Node {
  id: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // for pulse/fade
}

interface Link {
  a: number; // index of source node
  b: number; // index of target node
  strength: number;
}

export const ReasoningTraceGraph = ({
  events,
  className,
  darkMode,
}: {
  events: TraceEvent[];
  className?: string;
  darkMode?: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastEventCountRef = useRef<number>(0);

  // Map events to nodes/links incrementally
  useEffect(() => {
    const width = canvasRef.current?.width || 600;
    const height = canvasRef.current?.height || 300;

    for (let i = lastEventCountRef.current; i < events.length; i++) {
      const e = events[i];
      const color = EVENT_COLORS[e.type];
      const n: Node = {
        id: e.id,
        color,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        life: 1,
      };
      const idx = nodesRef.current.push(n) - 1;
      if (idx > 0) {
        linksRef.current.push({ a: idx - 1, b: idx, strength: 0.03 });
      }
      // extra sparks for graph calls
      if (e.type === "graph_call") {
        for (let k = 0; k < 3; k++) {
          const spark: Node = {
            id: `${e.id}-spark-${k}`,
            color,
            x: n.x,
            y: n.y,
            vx: (Math.random() - 0.5) * 2.2,
            vy: (Math.random() - 0.5) * 2.2,
            life: 0.8,
          };
          nodesRef.current.push(spark);
        }
      }
    }
    lastEventCountRef.current = events.length;
  }, [events]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let last = performance.now();

    const step = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      const width = canvas.width;
      const height = canvas.height;

      // fade trail based on theme (pure white or pure black bg)
      ctx.fillStyle = darkMode ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
      ctx.fillRect(0, 0, width, height);

      // simple force between consecutive nodes
      for (const link of linksRef.current) {
        const a = nodesRef.current[link.a];
        const b = nodesRef.current[link.b];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const force = (dist - 60) * link.strength; // spring length ~60
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      for (const n of nodesRef.current) {
        // slight center gravity
        n.vx += (width / 2 - n.x) * 0.0006;
        n.vy += (height / 2 - n.y) * 0.0006;

        n.x += n.vx;
        n.y += n.vy;
        // friction
        n.vx *= 0.98;
        n.vy *= 0.98;
        // bounce
        if (n.x < 0 || n.x > width) n.vx *= -0.9;
        if (n.y < 0 || n.y > height) n.vy *= -0.9;
        n.x = Math.max(0, Math.min(width, n.x));
        n.y = Math.max(0, Math.min(height, n.y));
        // fade life for pulse effect
        n.life = Math.max(0, n.life - 0.003);
      }

      // draw links
      ctx.lineWidth = 1.2;
      for (const l of linksRef.current) {
        const a = nodesRef.current[l.a];
        const b = nodesRef.current[l.b];
        ctx.strokeStyle = darkMode
          ? "rgba(148, 163, 184, 0.35)"
          : "rgba(100, 116, 139, 0.25)"; // slightly lighter on white
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // draw nodes with glow
      for (const n of nodesRef.current) {
        const r = 3 + 3 * n.life;
        ctx.save();
        ctx.shadowBlur = 18 * (0.5 + n.life);
        ctx.shadowColor = n.color;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // prune old sparks
      if (nodesRef.current.length > 600) {
        nodesRef.current.splice(0, nodesRef.current.length - 600);
      }
      if (linksRef.current.length > 400) {
        linksRef.current.splice(0, linksRef.current.length - 400);
      }

      rafRef.current = prefersReduced ? null : requestAnimationFrame(step);
    };

    // clear to transparent for overlay blending
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!prefersReduced) {
      rafRef.current = requestAnimationFrame(step);
    } else {
      // Single static render for reduced motion users
      const width = canvas.width;
      const height = canvas.height;
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, 0, width, height);
      for (const l of linksRef.current) {
        const a = nodesRef.current[l.a];
        const b = nodesRef.current[l.b];
        ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (const n of nodesRef.current) {
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [darkMode]);

  // Resize to parent
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = Math.max(300, Math.floor(width * dpr));
      canvas.height = Math.max(180, Math.floor(height * dpr));
      canvas.style.width = `${Math.floor(width)}px`;
      canvas.style.height = `${Math.floor(height)}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={"relative w-full h-full " + (className || "")}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Color legend (subtle) */}
      <div className="absolute bottom-2 right-2 flex gap-2 text-xs text-muted-foreground/80 bg-background/50 backdrop-blur rounded-md px-2 py-1">
        <span className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: EVENT_COLORS.start }}
          ></span>
          Start
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: EVENT_COLORS.reasoning }}
          ></span>
          Reason
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: EVENT_COLORS.graph_call }}
          ></span>
          Call
        </span>
        <span className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: EVENT_COLORS.end }}
          ></span>
          End
        </span>
      </div>
    </div>
  );
};

export default ReasoningTraceGraph;
