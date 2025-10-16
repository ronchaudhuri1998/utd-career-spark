import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, DollarSign, Briefcase, TrendingUp, Building } from "lucide-react";
import ChatbotPanel from "@/components/ChatbotPanel";

const JobMarket = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  const jobs = [
    {
      id: 1,
      title: "Data Scientist",
      company: "Google",
      location: "Mountain View, CA",
      salary: "$120K - $180K",
      skills: ["Python", "Machine Learning", "SQL"],
      type: "Full-time",
    },
    {
      id: 2,
      title: "Machine Learning Engineer",
      company: "Meta",
      location: "Menlo Park, CA",
      salary: "$130K - $200K",
      skills: ["PyTorch", "TensorFlow", "Python"],
      type: "Full-time",
    },
    {
      id: 3,
      title: "Data Analyst",
      company: "Amazon",
      location: "Seattle, WA",
      salary: "$85K - $120K",
      skills: ["SQL", "Python", "Tableau"],
      type: "Full-time",
    },
    {
      id: 4,
      title: "Research Scientist",
      company: "Microsoft",
      location: "Redmond, WA",
      salary: "$140K - $210K",
      skills: ["Deep Learning", "Research", "Python"],
      type: "Full-time",
    },
  ];

  const trendingSkills = [
    { name: "Python", demand: 95 },
    { name: "Machine Learning", demand: 88 },
    { name: "SQL", demand: 82 },
    { name: "TensorFlow", demand: 75 },
    { name: "Data Analysis", demand: 70 },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
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
              <h1 className="text-2xl font-bold text-foreground">Job Market Overview</h1>
              <p className="text-sm text-muted-foreground">
                Powered by AI agent that automatically scrapes job postings from LinkedIn, Indeed, and Glassdoor
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">Role Type</label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="data-scientist">Data Scientist</SelectItem>
                        <SelectItem value="ml-engineer">ML Engineer</SelectItem>
                        <SelectItem value="analyst">Data Analyst</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="ca">California</SelectItem>
                        <SelectItem value="wa">Washington</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Cards */}
            <div className="space-y-4">
              {jobs.map((job, index) => (
                <Card
                  key={job.id}
                  className="shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                            <Building className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-foreground">{job.title}</h3>
                            <p className="text-muted-foreground">{job.company}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="w-4 h-4" />
                            {job.salary}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Briefcase className="w-4 h-4" />
                            {job.type}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {job.skills.map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button className="bg-gradient-primary hover:opacity-90 transition-opacity">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar - Trending Skills */}
          <div>
            <Card className="shadow-card sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Trending Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingSkills.map((skill, index) => (
                  <div key={skill.name} className="space-y-2 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-muted-foreground">{skill.demand}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary transition-all duration-1000"
                        style={{ width: `${skill.demand}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ChatbotPanel />
    </div>
  );
};

export default JobMarket;
