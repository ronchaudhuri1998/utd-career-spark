import { useEffect, useState } from "react";

export const AgenticWorkflowAnimation = () => {
  const [activeNode, setActiveNode] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % 5);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const agents = [
    { id: 0, name: "Supervisor", x: 400, y: 100, color: "#8B5CF6" },
    { id: 1, name: "Course Catalog", x: 200, y: 250, color: "#3B82F6" },
    { id: 2, name: "Job Market", x: 400, y: 300, color: "#10B981" },
    { id: 3, name: "Project Advisor", x: 600, y: 250, color: "#F59E0B" },
    { id: 4, name: "User", x: 400, y: 450, color: "#EF4444" },
  ];

  const connections = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 0, to: 3 },
    { from: 1, to: 4 },
    { from: 2, to: 4 },
    { from: 3, to: 4 },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <svg
        viewBox="0 0 800 550"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: "#8B5CF6", stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "#3B82F6", stopOpacity: 1 }}
            />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines with animation */}
        {connections.map((conn, idx) => {
          const fromAgent = agents[conn.from];
          const toAgent = agents[conn.to];
          const isActive = activeNode === conn.from || activeNode === conn.to;

          return (
            <g key={idx}>
              <line
                x1={fromAgent.x}
                y1={fromAgent.y}
                x2={toAgent.x}
                y2={toAgent.y}
                stroke={isActive ? fromAgent.color : "#374151"}
                strokeWidth={isActive ? "3" : "2"}
                strokeDasharray="5,5"
                opacity={isActive ? 1 : 0.3}
                style={{
                  transition: "all 0.5s ease",
                }}
              >
                {isActive && (
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="10"
                    dur="0.5s"
                    repeatCount="indefinite"
                  />
                )}
              </line>
            </g>
          );
        })}

        {/* Agent nodes */}
        {agents.map((agent) => {
          const isActive = activeNode === agent.id;
          return (
            <g key={agent.id}>
              {/* Pulse effect */}
              {isActive && (
                <circle
                  cx={agent.x}
                  cy={agent.y}
                  r="35"
                  fill={agent.color}
                  opacity="0.3"
                >
                  <animate
                    attributeName="r"
                    from="35"
                    to="50"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.3"
                    to="0"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Main circle */}
              <circle
                cx={agent.x}
                cy={agent.y}
                r="30"
                fill={agent.color}
                filter={isActive ? "url(#glow)" : ""}
                opacity={isActive ? 1 : 0.7}
                style={{
                  transition: "all 0.5s ease",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                  transformOrigin: `${agent.x}px ${agent.y}px`,
                }}
              />

              {/* Icon */}
              <g transform={`translate(${agent.x}, ${agent.y})`}>
                {agent.id === 0 && (
                  // Supervisor icon (crown)
                  <path
                    d="M-10,-5 L-5,-15 L0,-8 L5,-15 L10,-5 L10,5 L-10,5 Z"
                    fill="white"
                  />
                )}
                {agent.id === 1 && (
                  // Course icon (book)
                  <path
                    d="M-8,-10 L8,-10 L8,10 L-8,10 Z M-6,-8 L6,-8 M-6,-2 L6,-2 M-6,4 L6,4"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  />
                )}
                {agent.id === 2 && (
                  // Job Market icon (briefcase)
                  <path
                    d="M-10,-5 L10,-5 L10,10 L-10,10 Z M-5,-5 L-5,-10 L5,-10 L5,-5 M-10,0 L10,0"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  />
                )}
                {agent.id === 3 && (
                  // Project icon (lightbulb)
                  <g stroke="white" strokeWidth="2" fill="none">
                    <circle cx="0" cy="-3" r="7" />
                    <path d="M-3,5 L3,5 M-2,8 L2,8" />
                  </g>
                )}
                {agent.id === 4 && (
                  // User icon
                  <g>
                    <circle cx="0" cy="-5" r="5" fill="white" />
                    <path d="M-10,10 Q-10,0 0,0 Q10,0 10,10" fill="white" />
                  </g>
                )}
              </g>

              {/* Label */}
              <text
                x={agent.x}
                y={agent.y + 55}
                textAnchor="middle"
                className="text-sm font-semibold"
                fill={isActive ? agent.color : "#9CA3AF"}
                style={{
                  transition: "all 0.5s ease",
                }}
              >
                {agent.name}
              </text>
            </g>
          );
        })}

        {/* Data flow particles */}
        {connections.map((conn, idx) => {
          const fromAgent = agents[conn.from];
          const toAgent = agents[conn.to];
          const isActive = activeNode === conn.from;

          if (!isActive) return null;

          return (
            <circle
              key={`particle-${idx}`}
              r="4"
              fill={fromAgent.color}
              filter="url(#glow)"
            >
              <animateMotion
                dur="1s"
                repeatCount="indefinite"
                path={`M ${fromAgent.x} ${fromAgent.y} L ${toAgent.x} ${toAgent.y}`}
              />
            </circle>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p className="animate-pulse">
          AI agents collaborate to provide personalized career guidance
        </p>
      </div>
    </div>
  );
};

