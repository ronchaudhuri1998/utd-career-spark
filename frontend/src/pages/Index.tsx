import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AgenticWorkflowAnimation } from "@/components/landing/AgenticWorkflowAnimation";
import { FeatureCard } from "@/components/landing/FeatureCard";
import {
  BookOpen,
  Briefcase,
  Lightbulb,
  Sparkles,
  ArrowRight,
  Brain,
  Target,
  Rocket,
} from "lucide-react";
import "../components/landing/landing.css";

const Index = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/dashboard");
  };

  const handleLearnMore = () => {
    const agentsSection = document.getElementById("agents-section");
    agentsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Left side - Text content */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4 w-fit">
                <Sparkles className="w-4 h-4" />
                <span>Powered by AWS Bedrock & AgentCore</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                UTD Career Spark
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Your AI-powered career companion that orchestrates intelligent
              agents to guide your academic and professional journey
            </p>

            <div className="flex gap-4 items-center flex-wrap">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="text-lg px-8 py-6 group"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleLearnMore}
                className="text-lg px-8 py-6"
              >
                Learn More
              </Button>
            </div>

            <div className="pt-4">
              <h2 className="text-2xl font-bold mb-2">
                Intelligent Multi-Agent System
              </h2>
              <p className="text-muted-foreground">
                Watch our AI agents collaborate in real-time to provide you with
                personalized career guidance
              </p>
            </div>
          </div>

          {/* Right side - Animation */}
          <div className="flex items-center justify-center">
            <AgenticWorkflowAnimation />
          </div>
        </div>

        {/* Features Grid */}
        <div id="agents-section" className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Powered by Specialized AI Agents
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Brain className="w-12 h-12" />}
              title="Career Planner Supervisor"
              description="Orchestrates all agents, understands your goals, and coordinates intelligent responses to guide your career journey."
              gradient="bg-gradient-to-br from-purple-500 to-blue-500"
            />
            <FeatureCard
              icon={<BookOpen className="w-12 h-12" />}
              title="Course Catalog Agent"
              description="Analyzes UTD's course catalog to recommend classes aligned with your career goals and degree requirements."
              gradient="bg-gradient-to-br from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={<Briefcase className="w-12 h-12" />}
              title="Job Market Agent"
              description="Searches real-time job market data to find opportunities matching your skills and career aspirations."
              gradient="bg-gradient-to-br from-green-500 to-emerald-500"
            />
            <FeatureCard
              icon={<Lightbulb className="w-12 h-12" />}
              title="Project Advisor Agent"
              description="Suggests relevant projects, internships, and experiences to build your portfolio and enhance your resume."
              gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
            />
            <FeatureCard
              icon={<Target className="w-12 h-12" />}
              title="Personalized Guidance"
              description="Tailored recommendations based on your profile, preferences, and real-time feedback from multiple data sources."
              gradient="bg-gradient-to-br from-red-500 to-pink-500"
            />
            <FeatureCard
              icon={<Rocket className="w-12 h-12" />}
              title="Real-Time Collaboration"
              description="Agents work together seamlessly, sharing insights and coordinating to provide comprehensive career advice."
              gradient="bg-gradient-to-br from-indigo-500 to-purple-500"
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 rounded-2xl p-12 border-2 border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Ignite Your Career?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Let our AI agents guide you through your academic journey and help
            you achieve your career goals.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="text-lg px-8 py-6 group"
          >
            Launch Dashboard
            <Sparkles className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>
            Built for UTD Hackathon 2025 | Powered by AWS Bedrock & AgentCore
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
