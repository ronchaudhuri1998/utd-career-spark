import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target } from "lucide-react";

interface CareerGoalCardProps {
  careerGoal: string;
  isEditing: boolean;
  onCareerGoalChange: (value: string) => void;
}

const CareerGoalCard = ({
  careerGoal,
  isEditing,
  onCareerGoalChange,
}: CareerGoalCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          About Me
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label htmlFor="career-goal">Career Goal</Label>
          {isEditing ? (
            <Input
              id="career-goal"
              value={careerGoal}
              onChange={(e) => onCareerGoalChange(e.target.value)}
              placeholder="Enter your career goal"
            />
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              {careerGoal || "No career goal"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CareerGoalCard;
