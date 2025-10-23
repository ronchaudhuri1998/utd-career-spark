import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { Briefcase, Plus, Edit3, Trash2, Save, X } from "lucide-react";
import { UserExperience } from "@/contexts/UserDataContext";
import { format } from "date-fns";

interface ExperienceCardProps {
  experience: UserExperience[];
  newExperience: UserExperience;
  editingExperience: number | null;
  editingExperienceData: UserExperience;
  isEditing: boolean;
  onNewExperienceChange: (field: keyof UserExperience, value: string) => void;
  onNewExperienceStartDateChange: (date: Date | undefined) => void;
  onNewExperienceEndDateChange: (date: Date | undefined) => void;
  onAddExperience: () => void;
  onEditExperience: (index: number) => void;
  onEditingExperienceChange: (
    field: keyof UserExperience,
    value: string
  ) => void;
  onEditingExperienceStartDateChange: (date: Date | undefined) => void;
  onEditingExperienceEndDateChange: (date: Date | undefined) => void;
  onSaveEditExperience: () => void;
  onCancelEditExperience: () => void;
  onRemoveExperience: (index: number) => void;
}

const ExperienceCard = ({
  experience,
  newExperience,
  editingExperience,
  editingExperienceData,
  isEditing,
  onNewExperienceChange,
  onNewExperienceStartDateChange,
  onNewExperienceEndDateChange,
  onAddExperience,
  onEditExperience,
  onEditingExperienceChange,
  onEditingExperienceStartDateChange,
  onEditingExperienceEndDateChange,
  onSaveEditExperience,
  onCancelEditExperience,
  onRemoveExperience,
}: ExperienceCardProps) => {
  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate) return "";

    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : null;

      // Check if dates are valid
      if (isNaN(start.getTime())) {
        return startDate; // Return original string if invalid
      }
      if (end && isNaN(end.getTime())) {
        return `${format(start, "MMM yyyy")} – ${endDate}`; // Return original endDate if invalid
      }

      const startFormatted = format(start, "MMM yyyy");
      const endFormatted = end ? format(end, "MMM yyyy") : "Present";

      return `${startFormatted} – ${endFormatted}`;
    } catch (error) {
      console.warn("Error formatting date range:", error);
      return startDate || ""; // Return original string on error
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Experience
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isEditing && (
          <div className="space-y-4 p-4 border border-dashed border-border rounded-lg">
            <h4 className="font-medium">Add New Experience</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-company">Company/Institution</Label>
                <Input
                  id="new-company"
                  value={newExperience.company}
                  onChange={(e) =>
                    onNewExperienceChange("company", e.target.value)
                  }
                  placeholder="e.g., University of Illinois, Urbana-Champaign"
                />
              </div>
              <div>
                <Label htmlFor="new-technologies">Technologies</Label>
                <Input
                  id="new-technologies"
                  value={newExperience.technologies || ""}
                  onChange={(e) =>
                    onNewExperienceChange("technologies", e.target.value)
                  }
                  placeholder="e.g., Github Actions, Next.js, Pandas, Langchain"
                />
              </div>
              <div>
                <Label htmlFor="new-start-date">Start Date</Label>
                <DatePicker
                  date={
                    newExperience.startDate
                      ? new Date(newExperience.startDate)
                      : undefined
                  }
                  onDateChange={onNewExperienceStartDateChange}
                  placeholder="Select start date"
                />
              </div>
              <div>
                <Label htmlFor="new-end-date">End Date</Label>
                <DatePicker
                  date={
                    newExperience.endDate
                      ? new Date(newExperience.endDate)
                      : undefined
                  }
                  onDateChange={onNewExperienceEndDateChange}
                  placeholder="Select end date (optional)"
                />
              </div>
              <div>
                <Label htmlFor="new-location">Location</Label>
                <Input
                  id="new-location"
                  value={newExperience.location || ""}
                  onChange={(e) =>
                    onNewExperienceChange("location", e.target.value)
                  }
                  placeholder="e.g., Champaign, IL"
                />
              </div>
              <div>
                <Label htmlFor="new-title">Job Title</Label>
                <Input
                  id="new-title"
                  value={newExperience.title}
                  onChange={(e) =>
                    onNewExperienceChange("title", e.target.value)
                  }
                  placeholder="e.g., Research Assistant"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  value={newExperience.description}
                  onChange={(e) =>
                    onNewExperienceChange("description", e.target.value)
                  }
                  placeholder="Describe your responsibilities and achievements"
                  rows={3}
                />
              </div>
            </div>
            <Button onClick={onAddExperience} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Experience
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {experience.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No experience added yet</p>
            </div>
          ) : (
            experience.map((exp, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                {editingExperience === index ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`edit-company-${index}`}>
                          Company/Institution
                        </Label>
                        <Input
                          id={`edit-company-${index}`}
                          value={editingExperienceData.company}
                          onChange={(e) =>
                            onEditingExperienceChange("company", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-technologies-${index}`}>
                          Technologies
                        </Label>
                        <Input
                          id={`edit-technologies-${index}`}
                          value={editingExperienceData.technologies || ""}
                          onChange={(e) =>
                            onEditingExperienceChange(
                              "technologies",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-start-date-${index}`}>
                          Start Date
                        </Label>
                        <DatePicker
                          date={
                            editingExperienceData.startDate
                              ? new Date(editingExperienceData.startDate)
                              : undefined
                          }
                          onDateChange={onEditingExperienceStartDateChange}
                          placeholder="Select start date"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-end-date-${index}`}>
                          End Date
                        </Label>
                        <DatePicker
                          date={
                            editingExperienceData.endDate
                              ? new Date(editingExperienceData.endDate)
                              : undefined
                          }
                          onDateChange={onEditingExperienceEndDateChange}
                          placeholder="Select end date (optional)"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-location-${index}`}>
                          Location
                        </Label>
                        <Input
                          id={`edit-location-${index}`}
                          value={editingExperienceData.location || ""}
                          onChange={(e) =>
                            onEditingExperienceChange(
                              "location",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-title-${index}`}>Job Title</Label>
                        <Input
                          id={`edit-title-${index}`}
                          value={editingExperienceData.title}
                          onChange={(e) =>
                            onEditingExperienceChange("title", e.target.value)
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor={`edit-description-${index}`}>
                          Description
                        </Label>
                        <Textarea
                          id={`edit-description-${index}`}
                          value={editingExperienceData.description}
                          onChange={(e) =>
                            onEditingExperienceChange(
                              "description",
                              e.target.value
                            )
                          }
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={onSaveEditExperience}
                        size="sm"
                        className="gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                      <Button
                        onClick={onCancelEditExperience}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Line 1: Company | Technologies | Date */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{exp.company}</span>
                            {exp.technologies && (
                              <>
                                <span className="text-muted-foreground">|</span>
                                <span className="text-sm italic text-muted-foreground">
                                  {exp.technologies}
                                </span>
                              </>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDateRange(exp.startDate, exp.endDate)}
                          </span>
                        </div>

                        {/* Line 2: Title | Location */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{exp.title}</span>
                          </div>
                          {exp.location && (
                            <span className="text-sm text-muted-foreground">
                              {exp.location}
                            </span>
                          )}
                        </div>

                        {/* Line 3+: Description */}
                        {exp.description && (
                          <p className="text-sm text-muted-foreground ml-4">
                            {exp.description}
                          </p>
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => onEditExperience(index)}
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => onRemoveExperience(index)}
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExperienceCard;
