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
  Sparkles,
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
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [formData, setFormData] = useState({
    careerGoal: userData.careerGoal || "",
    resume: null as File | null,
    major: userData.major || "",
  });
  const [isDragOver, setIsDragOver] = useState(false);

  // Mock resume data
  const mockResumeData = {
    name: "Davis Mo",
    email: "davis.mo@utdallas.edu",
    phone: "217-974-5699",
    location: "Richardson, TX",
    citizenship: "US Citizen",
    linkedin: "www.linkedin.com/in/davismo",
    website: "www.davismo.dev",
    github: "www.github.com/davis118",
    summary:
      "Outgoing, high-energy but detailed Computer Science student with experience in React, Next.js, Supabase, and cloud deployment. Strong background in algorithms, robotics, and data engineering, including motion profiling, vector embeddings, and real-time dashboards. Research and industry experience in NLP, LLMs, and large-scale scraping pipelines, with a track record of winning technical competitions and delivering real-world solutions.",
    education: [
      {
        institution: "The University of Texas at Dallas",
        degree: "Bachelor of Science, Computer Science, CS2 Honors Program",
        location: "Richardson, TX",
        graduationDate: "Expected May 2028",
      },
      {
        institution: "Concordia International School",
        degree: "High School Diploma (3.97/4.0 GPA)",
        location: "Shanghai, China",
        graduationDate: "August 2021 – June 2025",
      },
    ],
    technicalSkills: {
      programmingLanguages: "Typescript, Python, C++, HTML, CSS",
      frameworks: "React, Next.js, Tailwind, Vite",
      tools: "Git, Github Actions, VS Code, Jupyter",
      libraries: "FAISS, OpenAI, Pandas, GSAP, shadcn/ui",
    },
    workExperience: [
      {
        title: "Research Assistant, Faculty Expertise and SDG Dashboard",
        company: "University of Illinois, Urbana-Champaign",
        location: "Champaign, IL",
        duration: "November 2024 – Present",
        technologies: "Github Actions, Next.js, Pandas, Langchain",
        description:
          "Deployed data pipeline to Github Actions, scraping 7,000+ university papers with Selenium and proxy switching. Designed full-stack dashboard with React, Vercel, and vector embeddings, enabling discovery of faculty expertise. Used large language models (LLMs) for NLP processing of sustainability relevance, reaching 85% accuracy. Partnered with non-technical faculty stakeholders to translate accreditation requirements into product features.",
      },
      {
        title: "AI Team Intern",
        company: "Qihoo 360",
        location: "Beijing, China",
        duration: "June 2025 – July 2025",
        technologies: "Vue.js, React, GSAP",
        description:
          "Developed and maintained internal tools to visualize service performance with React and Vue.js. Built data dashboard with GSAP, displaying metrics for a network security tool with 3,000,000+ requests per day. Created customer-facing visualizations comparing internal and external LLM performance across benchmarks. Authored a detailed report evaluating LLM-assisted front-end development tools, guiding internal use.",
      },
    ],
    projects: [
      {
        title: "Data Analytics E-book (Co-Author)",
        duration: "June 2021 – September 2024",
        technologies: "Mathematica Cloud, Mathematica, React",
        description:
          "Developed 14 automated data analytics modules analyzing financial disclosures, web scraping, sentiment analysis, corporate website frontpages, CEO linguistic style. Created a React + Wolfram Cloud platform to display student-facing interactive modules. Co-authored an e-book (ISBN: 9780965053280) on data analytics, winning 2024 Wolfram Innovator Award.",
      },
      {
        title: "USACO Competition",
        duration: "June 2021 – September 2024",
        technologies: "C++, Data Structures and Algorithms",
        description:
          "Solved problems by creatively using algorithms such as dynamic programming, graph traversal, and greedy optimization. Consistently ranked in USACO Gold by demonstrating strong C++ and algorithmic design skills.",
      },
    ],
    studentOrganizations: [
      {
        title: "VEX Robotics Team",
        role: "Robotics Team Lead (Concordia International) | Developer (UT Dallas)",
        location: "Richardson, TX",
        duration: "June 2023 – Current",
        technologies: "Fusion360, C++, Python, ROS2",
        description:
          "Optimized mechanical subsystems for VEX Robotics Competition using Fusion360 and physical testing. Developed and implemented path-following algorithm with motion profiling enabling smooth autonomous movement, achieving 180% speedup compared to baseline approach. Led a 4-member team via planning, delegation, and communication, qualifying to VEX World Championships. Worked with ROS2 and Docker containers to interface with Jetson Nano.",
      },
      {
        title: "Nebula Labs",
        role: "UTD Trends Developer",
        location: "Richardson, TX",
        duration: "August 2025 – Current",
        technologies: "Next.js, SSR, Supabase, PostgreSQL, Vercel",
        description:
          "Maintained and enhanced the Next.js frontend for UTD Trends, a tool aggregating Rate My Professor, grade, and course data, serving 10,000+ unique annual impressions. Contributed to 3 feature/bug issues and began developing a Gemini-powered RMP data analyzer for advanced insights. Gained experience with product management tools including Atlassian Confluence and Jira.",
      },
      {
        title: "Artificial Intelligence Society",
        role: "Innovation Lab Developer",
        location: "Richardson, TX",
        duration: "August 2025 – Current",
        technologies: "Web scraping, AI chatbot development",
        description:
          "Developed AskTemoc, an AI chatbot streamlining UTD advising via web scraping. Implemented frontend interfaces and backend data extraction to deliver accurate, real-time advising information.",
      },
    ],
  };

  const handleFileUpload = (file: File | null) => {
    if (file) {
      // Automatically load Davis Mo resume data when any file is uploaded
      const mockFile = new File(
        [JSON.stringify(mockResumeData)],
        "davis_mo_resume.json",
        {
          type: "application/json",
        }
      );
      setFormData({
        ...formData,
        resume: mockFile,
      });
      toast.success("Mock resume data loaded automatically!");
    } else {
      setFormData({
        ...formData,
        resume: null,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileUpload(file);
  };

  const handleEnhanceWithAI = async () => {
    if (!formData.careerGoal.trim()) {
      toast.error("Please enter your career goal first");
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await processCareerGoal(formData.careerGoal);
      // Update the form data with the processed goal
      setFormData((prev) => ({
        ...prev,
        careerGoal: response.processed_goal,
      }));
      toast.success("Career goal enhanced with AI!");
    } catch (error) {
      console.error("Failed to enhance career goal:", error);
      toast.error("Failed to enhance career goal. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleContinue = async () => {
    if (step === 1 && !formData.careerGoal) {
      toast.error("Please enter your career goal");
      return;
    }

    if (step === 1) {
      // Just move to next step without processing
      setStep(step + 1);
    } else if (step === 2) {
      // Process resume data if uploaded
      if (formData.resume) {
        try {
          // If it's the mock resume, extract the data
          if (formData.resume.name === "davis_mo_resume.json") {
            const resumeText = await formData.resume.text();
            const resumeData = JSON.parse(resumeText);

            // Update user data with resume information
            updateUserData({
              name: resumeData.name,
              email: resumeData.email,
              phone: resumeData.phone,
              location: resumeData.location,
              major: resumeData.education[0]?.degree.includes(
                "Computer Science"
              )
                ? "Computer Science"
                : formData.major,
              graduationYear: resumeData.education[0]?.graduationDate.includes(
                "2028"
              )
                ? "2028"
                : "",
              skills: [
                ...resumeData.technicalSkills.programmingLanguages.split(", "),
                ...resumeData.technicalSkills.frameworks.split(", "),
                ...resumeData.technicalSkills.tools.split(", "),
                ...resumeData.technicalSkills.libraries.split(", "),
              ],
              experience: resumeData.workExperience.map((exp: any) => {
                // Parse duration strings to proper date formats
                const durationParts = exp.duration.split(" – ");
                const startDate = durationParts[0];
                const endDate = durationParts[1];

                // Convert month names to proper date format
                const parseDate = (dateStr: string) => {
                  if (dateStr === "Present") return undefined;

                  // Handle formats like "November 2024" or "June 2025"
                  const monthMap: { [key: string]: string } = {
                    January: "01",
                    February: "02",
                    March: "03",
                    April: "04",
                    May: "05",
                    June: "06",
                    July: "07",
                    August: "08",
                    September: "09",
                    October: "10",
                    November: "11",
                    December: "12",
                  };

                  const parts = dateStr.split(" ");
                  if (parts.length === 2) {
                    const month = monthMap[parts[0]];
                    const year = parts[1];
                    if (month && year) {
                      return `${year}-${month}-01`; // Use first day of month
                    }
                  }

                  return undefined;
                };

                return {
                  title: exp.title,
                  company: exp.company,
                  startDate: parseDate(startDate),
                  endDate: parseDate(endDate),
                  description: exp.description,
                  technologies: exp.technologies,
                  location: exp.location,
                };
              }),
              bio: resumeData.summary,
            });

            toast.success("Resume data processed and profile updated!");
          }
        } catch (error) {
          console.error("Error processing resume:", error);
          toast.error("Error processing resume data");
        }
      }
      setStep(step + 1);
    } else if (step === 3) {
      // Save all form data to user context
      updateUserData({
        careerGoal: formData.careerGoal,
        major: formData.major,
        bio:
          userData.bio ||
          `Passionate ${formData.major} student. ${formData.careerGoal} Looking to make an impact in the tech industry through innovative solutions.`,
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
              <div className="space-y-4">
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
                    disabled={isEnhancing}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleEnhanceWithAI}
                    disabled={isEnhancing || !formData.careerGoal.trim()}
                    variant="outline"
                    className="gap-2"
                  >
                    {isEnhancing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Enhance with AI
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Describe your career goals in natural language. Click "Enhance
                  with AI" to get a more structured and professional version.
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
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 cursor-pointer ${
                  isDragOver
                    ? "border-primary bg-primary/5 scale-105"
                    : "border-border hover:border-primary"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                  document.getElementById("resume-upload")?.click()
                }
              >
                <Upload
                  className={`w-12 h-12 mx-auto mb-4 transition-colors ${
                    isDragOver ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <p
                  className={`mb-2 transition-colors ${
                    isDragOver
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {isDragOver
                    ? "Drop your resume here!"
                    : "Drag and drop your resume here, or click to browse"}
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, DOC, DOCX up to 10MB
                </p>
                <Input
                  id="resume-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileInputChange}
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
                className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                {step === 3 ? "Complete Setup" : "Next"}
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
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
