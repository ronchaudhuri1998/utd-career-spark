import { createContext, useContext, ReactNode } from "react";
import { useSSE, UseSSEReturn } from "@/hooks/useSSE";

const SSEContext = createContext<UseSSEReturn | null>(null);

export const SSEProvider = ({ children }: { children: ReactNode }) => {
  const sseValue = useSSE();

  return <SSEContext.Provider value={sseValue}>{children}</SSEContext.Provider>;
};

export const useSSEContext = () => {
  const context = useContext(SSEContext);
  if (!context) {
    throw new Error("useSSEContext must be used within SSEProvider");
  }
  return context;
};
