import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit3, Save, X } from "lucide-react";

interface ProfileHeaderProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onBack: () => void;
}

const ProfileHeader = ({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onBack,
}: ProfileHeaderProps) => {
  return (
    <div className="bg-card/50 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={onSave} size="sm" className="gap-2">
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={onEdit} size="sm" className="gap-2">
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
