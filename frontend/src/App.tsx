import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserDataProvider } from "./contexts/UserDataContext";
import { SSEProvider } from "./contexts/SSEContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import JobMarket from "./pages/JobMarket";
import Projects from "./pages/Projects";
import Academics from "./pages/Academics";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserDataProvider>
      <SSEProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/job-market" element={<JobMarket />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/academics" element={<Academics />} />
              <Route path="/profile" element={<Profile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SSEProvider>
    </UserDataProvider>
  </QueryClientProvider>
);

export default App;
