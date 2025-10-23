import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";

interface AcademicInfoCardProps {
  major: string;
  gpa: string;
  coursesTaken: string;
  isEditing: boolean;
  onMajorChange: (value: string) => void;
  onGpaChange: (value: string) => void;
  onCoursesTakenChange: (value: string) => void;
}

const AcademicInfoCard = ({
  major,
  gpa,
  coursesTaken,
  isEditing,
  onMajorChange,
  onGpaChange,
  onCoursesTakenChange,
}: AcademicInfoCardProps) => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Academic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="major">Major</Label>
          {isEditing ? (
            <Input
              id="major"
              value={major}
              onChange={(e) => onMajorChange(e.target.value)}
              placeholder="Enter your major"
            />
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              {major || "No major"}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="gpa">GPA</Label>
          {isEditing ? (
            <Input
              id="gpa"
              value={gpa}
              onChange={(e) => onGpaChange(e.target.value)}
              placeholder="Enter your GPA"
            />
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              {gpa || "No GPA"}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="courses-taken">Courses Taken</Label>
          {isEditing ? (
            <Input
              id="courses-taken"
              value={coursesTaken}
              onChange={(e) => onCoursesTakenChange(e.target.value)}
              placeholder="e.g., CS 1336, MATH 2413, PHYS 2325"
            />
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              {coursesTaken || "No courses listed"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AcademicInfoCard;
