import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  Upload,
  Target,
  UserCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useUserData } from "@/contexts/UserDataContext";
import { processCareerGoal } from "@/lib/api";
import confetti from "canvas-confetti";

interface OnboardingModalProps {
  open: boolean;
  onClose?: () => void;
}

const OnboardingModal = ({ open, onClose }: OnboardingModalProps) => {
  const navigate = useNavigate();
  const { userData, updateUserData, setOnboarded } = useUserData();
  const [step, setStep] = useState(1);
  const [isProcessingGoal, setIsProcessingGoal] = useState(false);
  const [formData, setFormData] = useState({
    careerGoal: userData.careerGoal || "",
    resume: null as File | null,
    major: userData.major || "",
  });

  const handleContinue = async () => {
    if (step === 1 && !formData.careerGoal) {
      toast.error("Please enter your career goal");
      return;
    }

    if (step === 1) {
      // Process the career goal using the API
      setIsProcessingGoal(true);
      try {
        const response = await processCareerGoal(formData.careerGoal);
        // Update the form data with the processed goal
        setFormData((prev) => ({
          ...prev,
          careerGoal: response.processed_goal,
        }));
        toast.success("Career goal processed successfully!");
        setStep(step + 1);
      } catch (error) {
        console.error("Failed to process career goal:", error);
        toast.error("Failed to process career goal. Using original input.");
        setStep(step + 1);
      } finally {
        setIsProcessingGoal(false);
      }
    } else if (step === 3) {
      // Save all form data to user context
      updateUserData({
        careerGoal: formData.careerGoal,
        major: formData.major,
        bio: `Passionate ${formData.major} student. ${formData.careerGoal} Looking to make an impact in the tech industry through innovative solutions.`,
      });

      setOnboarded(true);

      // TODO: Integrate AgentCore memory - record user onboarding goal
      // Example: runtime.record_user_goal(session_id, formData.careerGoal)

      setStep(step + 1);
    } else {
      setStep(step + 1);
    }
  };

  const handleDone = () => {
    toast.success("Profile created successfully!");
    onClose?.();
    navigate("/dashboard");
  };

  const handleEditProfile = () => {
    onClose?.();
    navigate("/profile");
  };

  // Trigger confetti when reaching step 4
  useEffect(() => {
    if (step === 4) {
      // Fire confetti from both sides
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ["#f97316", "#fb923c", "#fdba74", "#0ea5e9", "#38bdf8"];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [step]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Career Onboarding</DialogTitle>
        </DialogHeader>

        {step < 4 && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 animate-float shadow-elegant">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Plan your Career with Agentic AI
            </h1>
            <p className="text-muted-foreground">
              Let's personalize your experience
            </p>
          </div>
        )}

        <div className="bg-card rounded-2xl p-6">
          {/* Progress indicator */}
          {step < 4 && (
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    i <= step ? "bg-gradient-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Step 1: Career Goal */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">
                  What's your career goal?
                </h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="career-goal">Career Goal</Label>
                <Textarea
                  id="career-goal"
                  placeholder="Tell us about your career aspirations in your own words... e.g., 'I want to become a data scientist working with machine learning' or 'I'm interested in becoming a software engineer at a tech company'"
                  value={formData.careerGoal}
                  onChange={(e) =>
                    setFormData({ ...formData, careerGoal: e.target.value })
                  }
                  className="min-h-[120px] resize-none"
                  disabled={isProcessingGoal}
                />
                <p className="text-sm text-muted-foreground">
                  Describe your career goals in natural language. Our AI will
                  help structure and clarify your aspirations.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Resume Upload */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">
                  Upload your resume (optional)
                </h2>
              </div>
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  Drag and drop your resume here, or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, DOC, DOCX up to 10MB
                </p>
                <Input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      resume: e.target.files?.[0] || null,
                    })
                  }
                />
              </div>
              {formData.resume && (
                <p className="text-sm text-muted-foreground text-center">
                  Selected: {formData.resume.name}
                </p>
              )}
            </div>
          )}

          {/* Step 3: Major & Courses */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Select your major</h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Select
                  value={formData.major}
                  onValueChange={(value) =>
                    setFormData({ ...formData, major: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your major" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="Computer Science">
                      Computer Science
                    </SelectItem>
                    <SelectItem value="Software Engineering">
                      Software Engineering
                    </SelectItem>
                    <SelectItem value="Data Science">Data Science</SelectItem>
                    <SelectItem value="Information Technology">
                      Information Technology
                    </SelectItem>
                    <SelectItem value="Computer Engineering">
                      Computer Engineering
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* TODO: Add AgentCore integration here
                  - Fetch AgentCore status on mount
                  - Display AgentCore memory availability
                  - Show session ID if available
                  Example:
                  <div className="mt-4 p-3 border rounded-lg bg-muted/50">
                    <p className="text-sm">
                      AgentCore Status: {agentcoreAvailable ? "Connected" : "Unavailable"}
                    </p>
                  </div>
              */}
            </div>
          )}

          {/* Step 4: Congratulations */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in text-center py-12">
              <div>
                <h2 className="text-5xl font-bold text-foreground mb-6">
                  Congratulations!
                </h2>
                <p className="text-muted-foreground text-lg mb-2">
                  Your profile is all set up!
                </p>
                <p className="text-muted-foreground">
                  You're ready to explore personalized career guidance and build
                  your roadmap to success.
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-6 text-left space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="font-semibold">Career Goal</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {formData.careerGoal}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="font-semibold">Major</p>
                    <p className="text-sm text-muted-foreground">
                      {formData.major}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 4 && (
            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleContinue}
                disabled={isProcessingGoal}
                className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                {isProcessingGoal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : step === 3 ? (
                  "Complete Setup"
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          )}

          {/* Congratulations Screen Buttons */}
          {step === 4 && (
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button
                onClick={handleEditProfile}
                variant="outline"
                className="flex-1 gap-2"
              >
                <UserCircle className="w-4 h-4" />
                Edit Profile
              </Button>
              <Button
                onClick={handleDone}
                className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                Done - Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
