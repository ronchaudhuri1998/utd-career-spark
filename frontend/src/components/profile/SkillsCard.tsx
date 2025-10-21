import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

interface SkillsCardProps {
  skills: string[];
  newSkill: string;
  isEditing: boolean;
  onNewSkillChange: (value: string) => void;
  onAddSkill: () => void;
  onRemoveSkill: (skill: string) => void;
}

const SkillsCard = ({
  skills,
  newSkill,
  isEditing,
  onNewSkillChange,
  onAddSkill,
  onRemoveSkill,
}: SkillsCardProps) => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing && (
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => onNewSkillChange(e.target.value)}
              placeholder="Add a skill"
              className="flex-1"
            />
            <Button onClick={onAddSkill} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {skills.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground w-full">
              <p>No skills added yet</p>
            </div>
          ) : (
            skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="gap-2">
                {skill}
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveSkill(skill)}
                    className="h-auto p-0 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillsCard;
