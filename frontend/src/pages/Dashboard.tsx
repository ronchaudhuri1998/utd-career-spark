import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Briefcase,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Sparkles,
  User,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { useUserData } from "@/contexts/UserDataContext";
import MainChatOverlay from "@/components/MainChatOverlay";

const Dashboard = () => {
  const navigate = useNavigate();
  const { userData } = useUserData();

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
      trendingSkills: [
        { skill: "Python", trend: "+39%" },
        { skill: "Machine Learning", trend: "+28%" },
        { skill: "React", trend: "+45%" },
        { skill: "AWS", trend: "+32%" },
      ],
      jobAvailability: [
        { role: "Frontend Dev", trend: "+23%" },
        { role: "Backend Dev", trend: "-16%" },
        { role: "Data Scientist", trend: "+31%" },
      ],
      location: userData.location || "Dallas, TX",
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
        { label: "GPA Goal", value: userData.gpa || "3.8" },
      ],
      highlights:
        userData.skills.length > 0
          ? userData.skills.slice(0, 3)
          : [
              "CS 4375 - Machine Learning",
              "CS 4365 - Artificial Intelligence",
              "CS 4390 - Computer Networks",
            ],
      route: "/academics",
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col relative">
      {/* Profile Button */}
      <Button
        onClick={() => navigate("/profile")}
        className="fixed top-6 right-6 z-50 bg-primary hover:bg-primary/90 rounded-full w-12 h-12 p-0 shadow-lg"
      >
        <User className="w-5 h-5" />
      </Button>

      {/* Main Grid */}
      <main className="w-full flex-1 flex flex-col">
        <div className="flex flex-row gap-6 flex-1 p-6">
          {agentCards.map((agent, index) => (
            <Card
              key={agent.id}
              className="flex flex-col overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-card-hover min-w-[350px] flex-1"
            >
              <CardHeader
                className={`bg-gradient-to-r ${agent.gradient} text-white py-4`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <agent.icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-white text-lg">
                    {agent.title}
                  </CardTitle>
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

                {/* Job Market Specific Content */}
                {agent.id === "job-market" ? (
                  <div className="space-y-4">
                    {/* Trending Skills */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Trending Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {agent.trendingSkills?.map((skillData, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5"
                          >
                            <span className="text-sm font-medium text-foreground">
                              {skillData.skill}
                            </span>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-green-600" />
                              <span className="text-xs font-bold text-green-600">
                                {skillData.trend}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Job Availability */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          Job Availability
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>in {agent.location}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {agent.jobAvailability?.map((job, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between bg-secondary/50 rounded-lg p-3"
                          >
                            <div className="flex items-center gap-2">
                              <TrendingUp
                                className={`w-4 h-4 ${
                                  job.trend.startsWith("+")
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              />
                              <span className="text-sm font-medium text-foreground">
                                {job.role}
                              </span>
                              <span
                                className={`text-sm font-bold ${
                                  job.trend.startsWith("+")
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {job.trend}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Highlights for other cards */
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
                )}

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

      <MainChatOverlay />
    </div>
  );
};

export default Dashboard;
