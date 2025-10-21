import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, Award, User } from "lucide-react";
import { Course } from "@/types/course";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CourseListProps {
  courses: Course[];
}

export const CourseList = ({ courses }: CourseListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(
    courses[0] || null
  );

  // Get unique difficulties
  const difficulties = useMemo(() => {
    const diffs = new Set(courses.map((course) => course.difficulty));
    return ["all", ...Array.from(diffs)];
  }, [courses]);

  // Filter courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        searchQuery === "" ||
        course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.skills &&
          course.skills.some((skill) =>
            skill.toLowerCase().includes(searchQuery.toLowerCase())
          ));

      const matchesDifficulty =
        difficultyFilter === "all" || course.difficulty === difficultyFilter;

      return matchesSearch && matchesDifficulty;
    });
  }, [courses, searchQuery, difficultyFilter]);

  const getDifficultyColor = (difficulty: Course["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-300";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Course Catalog</CardTitle>
          <div className="space-y-3 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={difficultyFilter}
              onValueChange={setDifficultyFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((diff) => (
                  <SelectItem key={diff} value={diff}>
                    {diff === "all"
                      ? "All Difficulties"
                      : diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <Card
                    key={course.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedCourse?.id === course.id
                        ? "border-2 border-primary bg-primary/5"
                        : "border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base leading-tight">
                            {course.courseCode}: {course.courseName}
                          </h3>
                        </div>
                        <Badge
                          className={getDifficultyColor(course.difficulty)}
                        >
                          {course.difficulty}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>{course.credits} credits</span>
                        </div>
                        {course.professor && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{course.professor}</span>
                          </div>
                        )}
                        {course.semester && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{course.semester}</span>
                          </div>
                        )}
                      </div>
                      {course.prerequisites &&
                        course.prerequisites.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Prerequisites:</span>{" "}
                            {course.prerequisites.join(", ")}
                          </div>
                        )}
                      {course.skills && course.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {course.skills.slice(0, 5).map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {course.skills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{course.skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                      {course.description &&
                        selectedCourse?.id === course.id && (
                          <p className="text-sm text-muted-foreground pt-2 border-t mt-2">
                            {course.description}
                          </p>
                        )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No courses found matching your criteria.
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
            Showing {filteredCourses.length} of {courses.length} courses
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
