import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Lightbulb, BookOpen, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import ChatbotPanel from "@/components/ChatbotPanel";

const Dashboard = () => {
  const navigate = useNavigate();

  const agentCards = [
    {
      id: "job-market",
      title: "Job Market Overview",
      icon: Briefcase,
      description: "Explore trending roles and opportunities",
      metrics: [
        { label: "Open Positions", value: "1,247" },
        { label: "Avg Salary", value: "$95K" },
        { label: "Match Score", value: "87%" },
      ],
      highlights: [
        "Data Scientist positions up 23%",
        "Machine Learning roles in high demand",
        "Remote opportunities available",
      ],
      route: "/job-market",
      gradient: "from-orange-500 to-amber-500",
    },
    {
      id: "projects",
      title: "Projects Overview",
      icon: Lightbulb,
      description: "Discover project ideas to build your portfolio",
      metrics: [
        { label: "Recommended", value: "12" },
        { label: "Difficulty", value: "Medium" },
        { label: "Completion", value: "35%" },
      ],
      highlights: [
        "ML Image Classification Project",
        "Real-time Analytics Dashboard",
        "NLP Sentiment Analysis Tool",
      ],
      route: "/projects",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "academics",
      title: "Academic Planning",
      icon: BookOpen,
      description: "Plan your courses and skill development",
      metrics: [
        { label: "Courses", value: "8" },
        { label: "Credits", value: "24" },
        { label: "GPA Goal", value: "3.8" },
      ],
      highlights: [
        "CS 4375 - Machine Learning",
        "CS 4365 - Artificial Intelligence",
        "CS 4390 - Computer Networks",
      ],
      route: "/academics",
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">UTD Career Guidance</h1>
                <p className="text-sm text-muted-foreground">Welcome back! 👋</p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-2">
              <TrendingUp className="w-3 h-3" />
              Career: Data Scientist
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          {agentCards.map((agent, index) => (
            <Card
              key={agent.id}
              className="flex flex-col overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-card-hover animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className={`bg-gradient-to-r ${agent.gradient} text-white`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <agent.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{agent.title}</CardTitle>
                    <CardDescription className="text-white/90">
                      {agent.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {agent.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="bg-secondary/50 rounded-lg p-3 text-center"
                    >
                      <div className="text-2xl font-bold text-foreground">
                        {metric.value}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Highlights */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Key Highlights
                  </h4>
                  <ul className="space-y-2">
                    {agent.highlights.map((highlight, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => navigate(agent.route)}
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity group"
                >
                  Open {agent.title.split(" ")[0]}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Floating Chatbot */}
      <ChatbotPanel />
    </div>
  );
};

export default Dashboard;
