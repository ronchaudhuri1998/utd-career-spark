import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { GraduationCap, Upload, Target, Code } from "lucide-react";
import { toast } from "sonner";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    careerGoal: "",
    resume: null as File | null,
    major: "",
    skills: {
      python: 50,
      sql: 50,
      javascript: 50,
      dataAnalysis: 50,
    }
  });

  const handleContinue = () => {
    if (step === 1 && !formData.careerGoal) {
      toast.error("Please enter your career goal");
      return;
    }
    if (step === 4) {
      toast.success("Profile created successfully!");
      navigate("/dashboard");
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 animate-float shadow-elegant">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Plan your Career with Agentic AI
          </h1>
          <p className="text-muted-foreground text-lg">
            Let's personalize your experience
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-elegant p-8 border border-border">
          {/* Progress indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-gradient-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Career Goal */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">What's your career goal?</h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="career-goal">Career Goal</Label>
                <Textarea
                  id="career-goal"
                  placeholder="e.g., Data Scientist, Software Engineer, Product Manager..."
                  value={formData.careerGoal}
                  onChange={(e) => setFormData({ ...formData, careerGoal: e.target.value })}
                  className="min-h-[120px] resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Resume Upload */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Upload your resume (optional)</h2>
              </div>
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  Drag and drop your resume here, or click to browse
                </p>
                <p className="text-sm text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
                <Input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFormData({ ...formData, resume: e.target.files?.[0] || null })}
                />
              </div>
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
                <Select value={formData.major} onValueChange={(value) => setFormData({ ...formData, major: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your major" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="cs">Computer Science</SelectItem>
                    <SelectItem value="se">Software Engineering</SelectItem>
                    <SelectItem value="data">Data Science</SelectItem>
                    <SelectItem value="it">Information Technology</SelectItem>
                    <SelectItem value="ce">Computer Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 4: Skills */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Code className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">Rate your skill levels</h2>
              </div>
              <div className="space-y-6">
                {Object.entries(formData.skills).map(([skill, value]) => (
                  <div key={skill} className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="capitalize">{skill.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <span className="text-sm text-muted-foreground">{value}%</span>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={([newValue]) =>
                        setFormData({
                          ...formData,
                          skills: { ...formData.skills, [skill]: newValue }
                        })
                      }
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
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
              className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              {step === 4 ? "Continue to Dashboard" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
