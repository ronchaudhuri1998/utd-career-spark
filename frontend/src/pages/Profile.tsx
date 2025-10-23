import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserData, UserExperience } from "@/contexts/UserDataContext";
import ProfileHeader from "@/components/profile/ProfileHeader";
import UserInfoCard from "@/components/profile/UserInfoCard";
import AcademicInfoCard from "@/components/profile/AcademicInfoCard";
import CareerGoalCard from "@/components/profile/CareerGoalCard";
import SkillsCard from "@/components/profile/SkillsCard";
import ExperienceCard from "@/components/profile/ExperienceCard";

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
    coursesTaken: "",
    careerGoal: "",
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
    startDate: "",
    endDate: "",
    description: "",
    technologies: "",
    location: "",
  });
  const [editingExperienceData, setEditingExperienceData] =
    useState<UserExperience>({
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      description: "",
      technologies: "",
      location: "",
    });

  // Use userData directly - components will show default messages when data is empty

  // Initialize edit data when entering edit mode
  const handleEdit = () => {
    setEditData({
      name: userData.name || "",
      email: userData.email || "",
      phone: userData.phone || "",
      location: userData.location || "",
      graduationYear: userData.graduationYear || "",
      major: userData.major || "",
      gpa: userData.gpa || "",
      coursesTaken: userData.coursesTaken || "",
      careerGoal: userData.careerGoal || "",
      skills: [...userData.skills],
      experience: [...userData.experience],
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateUserData(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleBack = () => {
    navigate("/dashboard");
  };


  // Skills management
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

  // Experience management
  const addExperience = () => {
    if (newExperience.title.trim() && newExperience.company.trim()) {
      setEditData((prev) => ({
        ...prev,
        experience: [...prev.experience, { ...newExperience }],
      }));
      setNewExperience({
        title: "",
        company: "",
        startDate: "",
        endDate: "",
        description: "",
        technologies: "",
        location: "",
      });
    }
  };

  const updateExperience = (field: keyof UserExperience, value: string) => {
    setNewExperience((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNewExperienceStartDate = (date: Date | undefined) => {
    setNewExperience((prev) => ({
      ...prev,
      startDate: date?.toISOString().split("T")[0] || "",
    }));
  };

  const updateNewExperienceEndDate = (date: Date | undefined) => {
    setNewExperience((prev) => ({
      ...prev,
      endDate: date?.toISOString().split("T")[0] || "",
    }));
  };

  const updateEditingExperienceStartDate = (date: Date | undefined) => {
    setEditingExperienceData((prev) => ({
      ...prev,
      startDate: date?.toISOString().split("T")[0] || "",
    }));
  };

  const updateEditingExperienceEndDate = (date: Date | undefined) => {
    setEditingExperienceData((prev) => ({
      ...prev,
      endDate: date?.toISOString().split("T")[0] || "",
    }));
  };

  const editExperience = (index: number) => {
    setEditingExperience(index);
    setEditingExperienceData(editData.experience[index]);
  };

  const updateEditingExperience = (
    field: keyof UserExperience,
    value: string
  ) => {
    setEditingExperienceData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        startDate: "",
        endDate: "",
        description: "",
        technologies: "",
        location: "",
      });
    }
  };

  const cancelEditExperience = () => {
    setEditingExperience(null);
    setEditingExperienceData({
      title: "",
      company: "",
      startDate: "",
      endDate: "",
      description: "",
      technologies: "",
      location: "",
    });
  };

  const removeExperience = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
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
      <ProfileHeader
        isEditing={isEditing}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onBack={handleBack}
      />

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1">
            <UserInfoCard
              name={isEditing ? editData.name : userData.name}
              email={isEditing ? editData.email : userData.email}
              phone={isEditing ? editData.phone : userData.phone}
              location={isEditing ? editData.location : userData.location}
              graduationYear={
                isEditing ? editData.graduationYear : userData.graduationYear
              }
              isEditing={isEditing}
              onNameChange={(value) =>
                setEditData((prev) => ({ ...prev, name: value }))
              }
              onEmailChange={(value) =>
                setEditData((prev) => ({ ...prev, email: value }))
              }
              onPhoneChange={(value) =>
                setEditData((prev) => ({ ...prev, phone: value }))
              }
              onLocationChange={(value) =>
                setEditData((prev) => ({ ...prev, location: value }))
              }
              onGraduationYearChange={(value) =>
                setEditData((prev) => ({ ...prev, graduationYear: value }))
              }
            />

            <AcademicInfoCard
              major={isEditing ? editData.major : userData.major}
              gpa={isEditing ? editData.gpa : userData.gpa}
              coursesTaken={
                isEditing ? editData.coursesTaken : userData.coursesTaken
              }
              isEditing={isEditing}
              onMajorChange={(value) =>
                setEditData((prev) => ({ ...prev, major: value }))
              }
              onGpaChange={(value) =>
                setEditData((prev) => ({ ...prev, gpa: value }))
              }
              onCoursesTakenChange={(value) =>
                setEditData((prev) => ({ ...prev, coursesTaken: value }))
              }
            />

            <SkillsCard
              skills={isEditing ? editData.skills : userData.skills}
              newSkill={newSkill}
              isEditing={isEditing}
              onNewSkillChange={setNewSkill}
              onAddSkill={addSkill}
              onRemoveSkill={removeSkill}
            />
          </div>

          {/* Right Column - About Me and Experience */}
          <div className="lg:col-span-2">
            <CareerGoalCard
              careerGoal={isEditing ? editData.careerGoal : userData.careerGoal}
              isEditing={isEditing}
              onCareerGoalChange={(value) =>
                setEditData((prev) => ({ ...prev, careerGoal: value }))
              }
            />

            <ExperienceCard
              experience={isEditing ? editData.experience : userData.experience}
              newExperience={newExperience}
              editingExperience={editingExperience}
              editingExperienceData={editingExperienceData}
              isEditing={isEditing}
              onNewExperienceChange={updateExperience}
              onNewExperienceStartDateChange={updateNewExperienceStartDate}
              onNewExperienceEndDateChange={updateNewExperienceEndDate}
              onAddExperience={addExperience}
              onEditExperience={editExperience}
              onEditingExperienceChange={updateEditingExperience}
              onEditingExperienceStartDateChange={
                updateEditingExperienceStartDate
              }
              onEditingExperienceEndDateChange={updateEditingExperienceEndDate}
              onSaveEditExperience={saveEditExperience}
              onCancelEditExperience={cancelEditExperience}
              onRemoveExperience={removeExperience}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;