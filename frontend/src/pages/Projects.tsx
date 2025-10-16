import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Lightbulb, Code, RefreshCw, ExternalLink } from "lucide-react";
import ChatbotPanel from "@/components/ChatbotPanel";

const Projects = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("all");
  const [skillArea, setSkillArea] = useState("all");

  const projects = [
    {
      id: 1,
      title: "Image Classification with Deep Learning",
      description: "Build a CNN model to classify images using PyTorch. Train on CIFAR-10 dataset and deploy with Flask API.",
      difficulty: "Intermediate",
      skills: ["Python", "PyTorch", "CNN", "Flask"],
      techStack: ["PyTorch", "Flask", "Docker"],
      resources: "https://pytorch.org/tutorials/",
    },
    {
      id: 2,
      title: "Real-time Analytics Dashboard",
      description: "Create an interactive dashboard for real-time data visualization using streaming data from APIs.",
      difficulty: "Advanced",
      skills: ["React", "D3.js", "WebSocket", "Node.js"],
      techStack: ["React", "D3.js", "Node.js", "MongoDB"],
      resources: "https://reactjs.org/docs/",
    },
    {
      id: 3,
      title: "NLP Sentiment Analysis Tool",
      description: "Develop a sentiment analysis model using BERT to analyze customer reviews and feedback.",
      difficulty: "Intermediate",
      skills: ["Python", "NLP", "BERT", "Transformers"],
      techStack: ["Hugging Face", "Python", "Streamlit"],
      resources: "https://huggingface.co/transformers/",
    },
    {
      id: 4,
      title: "Personal Finance Tracker",
      description: "Build a web app to track expenses, income, and savings goals with data visualization.",
      difficulty: "Beginner",
      skills: ["JavaScript", "React", "Chart.js"],
      techStack: ["React", "Chart.js", "Firebase"],
      resources: "https://www.chartjs.org/",
    },
    {
      id: 5,
      title: "Recommendation System",
      description: "Implement collaborative filtering to build a movie recommendation engine using Python.",
      difficulty: "Advanced",
      skills: ["Python", "Machine Learning", "Pandas"],
      techStack: ["Python", "scikit-learn", "FastAPI"],
      resources: "https://scikit-learn.org/",
    },
    {
      id: 6,
      title: "Task Management API",
      description: "Create a RESTful API for task management with authentication and database integration.",
      difficulty: "Beginner",
      skills: ["Node.js", "Express", "MongoDB"],
      techStack: ["Node.js", "Express", "MongoDB", "JWT"],
      resources: "https://expressjs.com/",
    },
  ];

  const difficultyColor = {
    Beginner: "bg-green-500/10 text-green-700 border-green-200",
    Intermediate: "bg-blue-500/10 text-blue-700 border-blue-200",
    Advanced: "bg-purple-500/10 text-purple-700 border-purple-200",
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="hover:bg-secondary"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Project Ideas</h1>
                <p className="text-sm text-muted-foreground">Build your portfolio with these projects</p>
              </div>
            </div>
            <Button className="bg-gradient-primary hover:opacity-90 transition-opacity gap-2">
              <RefreshCw className="w-4 h-4" />
              Generate More
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Filters */}
        <Card className="shadow-card mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Skill Area</label>
                <Select value={skillArea} onValueChange={setSkillArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Areas" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Areas</SelectItem>
                    <SelectItem value="ml">Machine Learning</SelectItem>
                    <SelectItem value="web">Web Development</SelectItem>
                    <SelectItem value="data">Data Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project, index) => (
            <Card
              key={project.id}
              className="shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in flex flex-col"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <Badge
                    variant="outline"
                    className={difficultyColor[project.difficulty as keyof typeof difficultyColor]}
                  >
                    {project.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{project.title}</CardTitle>
                <CardDescription className="text-sm">
                  {project.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-4 mb-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Code className="w-4 h-4 text-primary" />
                      Skills Applied
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Tech Stack</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.techStack.join(" • ")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity">
                    Start Project
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={project.resources} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <ChatbotPanel />
    </div>
  );
};

export default Projects;
