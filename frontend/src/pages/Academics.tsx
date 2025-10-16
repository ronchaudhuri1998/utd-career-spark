import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, BookOpen, Star, Plus, ChevronRight } from "lucide-react";
import ChatbotPanel from "@/components/ChatbotPanel";

const Academics = () => {
  const navigate = useNavigate();

  const courses = [
    {
      code: "CS 4375",
      name: "Introduction to Machine Learning",
      skills: ["Python", "ML Algorithms", "Statistics"],
      prerequisites: ["CS 3345"],
      relevance: 5,
      credits: 3,
      semester: "Fall 2024",
    },
    {
      code: "CS 4365",
      name: "Artificial Intelligence",
      skills: ["AI Concepts", "Search Algorithms", "Logic"],
      prerequisites: ["CS 3345", "CS 3305"],
      relevance: 5,
      credits: 3,
      semester: "Spring 2025",
    },
    {
      code: "CS 4390",
      name: "Computer Networks",
      skills: ["TCP/IP", "Network Security", "Protocols"],
      prerequisites: ["CS 3305"],
      relevance: 3,
      credits: 3,
      semester: "Fall 2024",
    },
    {
      code: "CS 4348",
      name: "Operating Systems",
      skills: ["Process Management", "Memory", "File Systems"],
      prerequisites: ["CS 2336", "CS 3305"],
      relevance: 4,
      credits: 3,
      semester: "Spring 2025",
    },
    {
      code: "CS 4337",
      name: "Organization of Programming Languages",
      skills: ["Language Design", "Compilers", "Semantics"],
      prerequisites: ["CS 3345"],
      relevance: 3,
      credits: 3,
      semester: "Fall 2024",
    },
    {
      code: "CS 4485",
      name: "Senior Project",
      skills: ["Full-stack Dev", "Project Management", "Teamwork"],
      prerequisites: ["Senior Standing"],
      relevance: 5,
      credits: 3,
      semester: "Spring 2025",
    },
  ];

  const recommendedPlan = [
    {
      semester: "Fall 2024",
      courses: ["CS 4375", "CS 4390", "CS 4337"],
      credits: 9,
    },
    {
      semester: "Spring 2025",
      courses: ["CS 4365", "CS 4348", "CS 4485"],
      credits: 9,
    },
  ];

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < count ? "fill-primary text-primary" : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

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
              <h1 className="text-2xl font-bold text-foreground">Academic Planning</h1>
              <p className="text-sm text-muted-foreground">Plan your courses and skill development</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recommended Courses Table */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Recommended Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Prerequisites</TableHead>
                        <TableHead>Relevance</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course, index) => (
                        <TableRow
                          key={course.code}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <TableCell className="font-semibold">{course.code}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{course.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {course.credits} credits • {course.semester}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {course.skills.slice(0, 2).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {course.skills.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{course.skills.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {course.prerequisites.join(", ")}
                          </TableCell>
                          <TableCell>{renderStars(course.relevance)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 hover:bg-accent"
                            >
                              <Plus className="w-3 h-3" />
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Recommended Plan */}
          <div className="space-y-6">
            <Card className="shadow-card sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 text-primary" />
                  Recommended Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendedPlan.map((plan, index) => (
                  <div
                    key={plan.semester}
                    className="space-y-3 p-4 bg-secondary/50 rounded-lg animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{plan.semester}</h3>
                      <Badge variant="outline">{plan.credits} credits</Badge>
                    </div>
                    <div className="space-y-2">
                      {plan.courses.map((courseCode) => {
                        const course = courses.find((c) => c.code === courseCode);
                        return (
                          <div
                            key={courseCode}
                            className="text-sm p-2 bg-card rounded border border-border hover:border-primary transition-colors cursor-pointer"
                          >
                            <div className="font-medium">{courseCode}</div>
                            <div className="text-xs text-muted-foreground">
                              {course?.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
                  Save to My Plan
                </Button>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Progress Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">18</div>
                    <div className="text-xs text-muted-foreground">Total Credits</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">6</div>
                    <div className="text-xs text-muted-foreground">Courses</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center col-span-2">
                    <div className="text-2xl font-bold text-primary">3.8</div>
                    <div className="text-xs text-muted-foreground">Target GPA</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <ChatbotPanel />
    </div>
  );
};

export default Academics;
