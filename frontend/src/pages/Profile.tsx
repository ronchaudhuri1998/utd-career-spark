import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  useUserData,
  UserDataUpdate,
  UserExperience,
} from "@/contexts/UserDataContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { userData, updateUserData, isLoading } = useUserData();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    graduationYear: "",
    major: "",
    gpa: "",
    careerGoal: "",
    bio: "",
    skills: [] as string[],
    experience: [] as UserExperience[],
  });
  const [newSkill, setNewSkill] = useState("");
  const [editingExperience, setEditingExperience] = useState<number | null>(
    null
  );
  const [newExperience, setNewExperience] = useState<UserExperience>({
    title: "",
    company: "",
    duration: "",
    description: "",
  });
  const [editingExperienceData, setEditingExperienceData] =
    useState<UserExperience>({
      title: "",
      company: "",
      duration: "",
      description: "",
    });

  // Use default values for display when userData is empty
  const displayData = {
    name: userData.name || "John Doe",
    email: userData.email || "john.doe@utdallas.edu",
    phone: userData.phone || "+1 (555) 123-4567",
    location: userData.location || "Dallas, TX",
    graduationYear: userData.graduationYear || "2025",
    major: userData.major || "Computer Science",
    gpa: userData.gpa || "3.8",
    careerGoal: userData.careerGoal || "Data Scientist",
    bio:
      userData.bio ||
      "Passionate software engineering student with a focus on machine learning and data analysis. Looking to make an impact in the tech industry through innovative solutions.",
    skills:
      userData.skills.length > 0
        ? userData.skills
        : [
            "Python",
            "Machine Learning",
            "Data Analysis",
            "React",
            "SQL",
            "Statistics",
          ],
    experience:
      userData.experience.length > 0
        ? userData.experience
        : [
            {
              title: "Software Engineering Intern",
              company: "Tech Corp",
              duration: "Summer 2024",
              description:
                "Developed machine learning models for data analysis",
            },
            {
              title: "Research Assistant",
              company: "UTD Research Lab",
              duration: "Fall 2023 - Present",
              description: "Working on NLP research projects",
            },
          ],
  };

  const handleEdit = () => {
    setEditData({
      name: userData.name || "",
      email: userData.email || "",
      phone: userData.phone || "",
      location: userData.location || "",
      graduationYear: userData.graduationYear || "",
      major: userData.major || "",
      gpa: userData.gpa || "",
      careerGoal: userData.careerGoal || "",
      bio: userData.bio || "",
      skills: userData.skills || [],
      experience: userData.experience || [],
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    // Update the user data context with the new profile data
    const updates: UserDataUpdate = {
      name: editData.name,
      email: editData.email,
      phone: editData.phone,
      location: editData.location,
      graduationYear: editData.graduationYear,
      major: editData.major,
      gpa: editData.gpa,
      careerGoal: editData.careerGoal,
      bio: editData.bio,
      skills: editData.skills,
      experience: editData.experience,
    };
    updateUserData(updates);
    setIsEditing(false);
    setNewSkill("");
    setEditingExperience(null);
    setNewExperience({
      title: "",
      company: "",
      duration: "",
      description: "",
    });
    setEditingExperienceData({
      title: "",
      company: "",
      duration: "",
      description: "",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      name: "",
      email: "",
      phone: "",
      location: "",
      graduationYear: "",
      major: "",
      gpa: "",
      careerGoal: "",
      bio: "",
      skills: [],
      experience: [],
    });
    setNewSkill("");
    setEditingExperience(null);
    setNewExperience({
      title: "",
      company: "",
      duration: "",
      description: "",
    });
    setEditingExperienceData({
      title: "",
      company: "",
      duration: "",
      description: "",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Skills management functions
  const addSkill = () => {
    if (newSkill.trim() && !editData.skills.includes(newSkill.trim())) {
      setEditData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setEditData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  // Experience management functions
  const addExperience = () => {
    if (newExperience.title.trim() && newExperience.company.trim()) {
      setEditData((prev) => ({
        ...prev,
        experience: [...prev.experience, { ...newExperience }],
      }));
      setNewExperience({
        title: "",
        company: "",
        duration: "",
        description: "",
      });
    }
  };

  const updateExperience = (
    index: number,
    field: keyof UserExperience,
    value: string
  ) => {
    setEditData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const removeExperience = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const startEditExperience = (index: number) => {
    setEditingExperience(index);
    setEditingExperienceData(editData.experience[index]);
  };

  const saveEditExperience = () => {
    if (
      editingExperience !== null &&
      editingExperienceData.title.trim() &&
      editingExperienceData.company.trim()
    ) {
      setEditData((prev) => ({
        ...prev,
        experience: prev.experience.map((exp, i) =>
          i === editingExperience ? { ...editingExperienceData } : exp
        ),
      }));
      setEditingExperience(null);
      setEditingExperienceData({
        title: "",
        company: "",
        duration: "",
        description: "",
      });
    }
  };

  const cancelEditExperience = () => {
    setEditingExperience(null);
    setEditingExperienceData({
      title: "",
      company: "",
      duration: "",
      description: "",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
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
                  <Button onClick={handleSave} size="sm" className="gap-2">
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit} size="sm" className="gap-2">
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-12 h-12 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl">
                  {isEditing ? editData.name : displayData.name}
                </CardTitle>
                <CardDescription>
                  {isEditing ? editData.careerGoal : displayData.careerGoal}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{isEditing ? editData.email : displayData.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{isEditing ? editData.phone : displayData.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {isEditing ? editData.location : displayData.location}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    Graduating{" "}
                    {isEditing
                      ? editData.graduationYear
                      : displayData.graduationYear}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Academic Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Academic Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Major</Label>
                  {isEditing ? (
                    <Input
                      value={editData.major}
                      onChange={(e) =>
                        handleInputChange("major", e.target.value)
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {displayData.major}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">GPA</Label>
                  {isEditing ? (
                    <Input
                      value={editData.gpa}
                      onChange={(e) => handleInputChange("gpa", e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {displayData.gpa}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Career Goal</Label>
                  {isEditing ? (
                    <Input
                      value={editData.careerGoal}
                      onChange={(e) =>
                        handleInputChange("careerGoal", e.target.value)
                      }
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {displayData.careerGoal}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-muted-foreground">{displayData.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {editData.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="px-3 py-1 flex items-center gap-1"
                        >
                          {skill}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => removeSkill(skill)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill"
                        onKeyPress={(e) => e.key === "Enter" && addSkill()}
                      />
                      <Button onClick={addSkill} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {displayData.skills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="px-3 py-1"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    {editData.experience.map((exp, index) => (
                      <div
                        key={index}
                        className="border-l-2 border-primary/20 pl-4 space-y-2"
                      >
                        {editingExperience === index ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-sm font-medium">
                                  Title
                                </Label>
                                <Input
                                  value={editingExperienceData.title}
                                  onChange={(e) =>
                                    setEditingExperienceData((prev) => ({
                                      ...prev,
                                      title: e.target.value,
                                    }))
                                  }
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  Company
                                </Label>
                                <Input
                                  value={editingExperienceData.company}
                                  onChange={(e) =>
                                    setEditingExperienceData((prev) => ({
                                      ...prev,
                                      company: e.target.value,
                                    }))
                                  }
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">
                                Duration
                              </Label>
                              <Input
                                value={editingExperienceData.duration}
                                onChange={(e) =>
                                  setEditingExperienceData((prev) => ({
                                    ...prev,
                                    duration: e.target.value,
                                  }))
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">
                                Description
                              </Label>
                              <Textarea
                                value={editingExperienceData.description}
                                onChange={(e) =>
                                  setEditingExperienceData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                                }
                                className="mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={saveEditExperience} size="sm">
                                Save
                              </Button>
                              <Button
                                onClick={cancelEditExperience}
                                variant="outline"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{exp.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {exp.company}
                                </p>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {exp.duration}
                                </p>
                                <p className="text-sm">{exp.description}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => startEditExperience(index)}
                                  variant="ghost"
                                  size="sm"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => removeExperience(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="border-l-2 border-dashed border-muted pl-4 space-y-3">
                      <h4 className="font-semibold text-muted-foreground">
                        Add New Experience
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium">Title</Label>
                          <Input
                            value={newExperience.title}
                            onChange={(e) =>
                              setNewExperience((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            className="mt-1"
                            placeholder="e.g., Software Engineer"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Company</Label>
                          <Input
                            value={newExperience.company}
                            onChange={(e) =>
                              setNewExperience((prev) => ({
                                ...prev,
                                company: e.target.value,
                              }))
                            }
                            className="mt-1"
                            placeholder="e.g., Tech Corp"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Duration</Label>
                        <Input
                          value={newExperience.duration}
                          onChange={(e) =>
                            setNewExperience((prev) => ({
                              ...prev,
                              duration: e.target.value,
                            }))
                          }
                          className="mt-1"
                          placeholder="e.g., Summer 2024"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Description
                        </Label>
                        <Textarea
                          value={newExperience.description}
                          onChange={(e) =>
                            setNewExperience((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="mt-1"
                          placeholder="Describe your role and achievements..."
                        />
                      </div>
                      <Button
                        onClick={addExperience}
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Experience
                      </Button>
                    </div>
                  </>
                ) : (
                  displayData.experience.map((exp, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-primary/20 pl-4"
                    >
                      <h4 className="font-semibold">{exp.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {exp.company}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {exp.duration}
                      </p>
                      <p className="text-sm">{exp.description}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
