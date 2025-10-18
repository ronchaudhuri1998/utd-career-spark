import { useMemo, useRef, useState, ChangeEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useUserData } from "@/contexts/UserDataContext";
import { requestIntro, getAgentCoreStatus } from "@/lib/api";

type ChatMessage = {
  id: number;
  sender: "assistant" | "user";
  text: string;
};

const YEAR_OPTIONS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Graduate",
  "Bootcamp / Career Switcher",
];

const TIME_OPTIONS = [
  "5 hours/week",
  "10 hours/week",
  "15 hours/week",
  "20+ hours/week",
];

const createMessage = (sender: ChatMessage["sender"], text: string): ChatMessage => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  sender,
  text,
});

const Onboarding = () => {
  const navigate = useNavigate();
  const {
    userData,
    updateUserData,
    setOnboarded,
    runAgentWorkflow,
    setSessionId,
    sessionId,
  } = useUserData();

  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "assistant",
      "Hi! I'm your career copilot. Tell me your dream role and I'll help you build the roadmap."
    ),
  ]);
  const [chatInput, setChatInput] = useState(userData.careerGoal || "");
  const [goalConfirmed, setGoalConfirmed] = useState(Boolean(userData.careerGoal));
  const [introLoading, setIntroLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [activeGoal, setActiveGoal] = useState(userData.careerGoal || "");
  const [planGenerated, setPlanGenerated] = useState(false);

  const [formState, setFormState] = useState({
    studentYear: userData.studentYear || "",
    coursesTaken: userData.coursesTaken || "",
    about: userData.bio || "",
    timeCommitment: userData.timeCommitment || "",
    contactEmail: userData.email || "",
  });
  const [resumeName, setResumeName] = useState<string>("");
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const [agentcoreStatus, setAgentcoreStatus] = useState<{
    available: boolean;
    message: string;
  }>({
    available: false,
    message: "Checking AgentCore status...",
  });

  useEffect(() => {
    let cancelled = false;
    getAgentCoreStatus()
      .then((status) => {
        if (cancelled) {
          return;
        }
        setAgentcoreStatus({
          available: Boolean(status.available),
          message: status.available
            ? `AgentCore active${status.memory_id ? ` (memory ${status.memory_id})` : ""}.`
            : status.status || "AgentCore unavailable.",
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setAgentcoreStatus({
          available: false,
          message: `AgentCore status check failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canGeneratePlan = useMemo(() => {
    return (
      goalConfirmed &&
      formState.studentYear.trim().length > 0 &&
      formState.coursesTaken.trim().length > 0 &&
      formState.about.trim().length > 0 &&
      formState.timeCommitment.trim().length > 0
    );
  }, [goalConfirmed, formState]);

  const pushMessage = (msg: ChatMessage) =>
    setMessages((prev) => [...prev, msg]);

  const handleSendMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed) {
      toast.error("Please enter a message");
      return;
    }

    if (introLoading || planLoading) {
      return;
    }

    pushMessage(createMessage("user", trimmed));
    setChatInput("");

    if (!goalConfirmed) {
      setIntroLoading(true);
      try {
        const response = await requestIntro(trimmed, sessionId || undefined);
        if (response.session_id) {
          setSessionId(response.session_id);
        }

        updateUserData({
          careerGoal: trimmed,
          bio: formState.about || userData.bio,
        });

        pushMessage(createMessage("assistant", response.message));
        if (response.agentcore) {
          const statusLine = response.agentcore.available
            ? "AgentCore memory is active — your session will be saved."
            : `AgentCore unavailable: ${response.agentcore.status || "no status provided"}`;
          pushMessage(createMessage("assistant", statusLine));
        }
        pushMessage(
          createMessage(
            "assistant",
            "Share a few quick details below so I can tailor courses, projects, and internships. If you sign up later, we'll remember your answers automatically."
          )
        );
        setGoalConfirmed(true);
        setActiveGoal(trimmed);
      } catch (error) {
        console.error("Intro request failed", error);
        const errMsg =
          error instanceof Error
            ? error.message
            : "I can only help with specific career goals.";
        toast.error(errMsg);
        const friendly = errMsg.replace(/^REJECT:\s*/i, "").trim();
        pushMessage(
          createMessage(
            "assistant",
            friendly || "I can only help with specific career goals. Share the role or field you're aiming for."
          )
        );
      } finally {
        setIntroLoading(false);
      }
      return;
    }

    if (planGenerated) {
      pushMessage(
        createMessage(
          "assistant",
          "Your personalized dashboards are already live. Refresh or adjust the form on the right if you want to regenerate the plan."
        )
      );
      return;
    }

    setPlanLoading(true);
    try {
      pushMessage(
        createMessage(
          "assistant",
          "Running Job Market, Course, and Project agents to assemble your roadmap..."
        )
      );
      updateUserData({
        bio: trimmed,
      });
      const workflow = await runAgentWorkflow(activeGoal || userData.careerGoal || trimmed, {
        studentYear: formState.studentYear,
        coursesTaken: formState.coursesTaken,
        timeCommitment: formState.timeCommitment,
        about: trimmed,
        contactEmail: formState.contactEmail,
      });
      setPlanGenerated(true);
      pushMessage(
        createMessage(
          "assistant",
          "Thanks for sharing! I just generated your dashboards — explore the courses, project ideas, and job insights tailored to your goal."
        )
      );
      if (workflow?.agentcore) {
        const statusLine = workflow.agentcore.available
          ? "AgentCore stored this plan for your session."
          : `AgentCore unavailable: ${workflow.agentcore.status || "no status provided"}`;
        pushMessage(createMessage("assistant", statusLine));
      }
      setOnboarded(true);
      navigate("/dashboard");
    } catch (error) {
      console.error("Plan generation via chat failed", error);
      toast.error("I couldn't generate the roadmap. Please check the backend logs and try again.");
      pushMessage(
        createMessage(
          "assistant",
          "The plan couldn't be generated right now. Once the service is ready, resend your background or use the form to try again."
        )
      );
    } finally {
      setPlanLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!canGeneratePlan || planLoading) {
      if (!canGeneratePlan) {
        toast.error("Please complete the quick form before generating the roadmap.");
      }
      return;
    }

    setPlanLoading(true);

    updateUserData({
      studentYear: formState.studentYear,
      coursesTaken: formState.coursesTaken,
      timeCommitment: formState.timeCommitment,
      bio: formState.about,
      email: formState.contactEmail,
    });

    try {
      pushMessage(
        createMessage(
          "assistant",
          "Running Job Market, Course, and Project agents to assemble your roadmap..."
        )
      );
      const workflow = await runAgentWorkflow(activeGoal || userData.careerGoal || chatInput, {
        studentYear: formState.studentYear,
        coursesTaken: formState.coursesTaken,
        timeCommitment: formState.timeCommitment,
        about: formState.about,
        contactEmail: formState.contactEmail,
      });
      setOnboarded(true);
      pushMessage(
        createMessage(
          "assistant",
          "Fantastic! I assembled your dashboards with tailored courses, project ideas, and job insights."
        )
      );
      if (workflow?.agentcore) {
        const statusLine = workflow.agentcore.available
          ? "AgentCore stored this plan for your session."
          : `AgentCore unavailable: ${workflow.agentcore.status || "no status provided"}`;
        pushMessage(createMessage("assistant", statusLine));
      }
      setPlanGenerated(true);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setPlanLoading(false);
    }
  };

  const handleResumeClick = () => {
    resumeInputRef.current?.click();
  };

  const handleResumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeName(file.name);
      toast.success("Résumé noted. We’ll surface relevant projects and interviews.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-[2fr,1fr] animate-fade-in-up">
        <Card className="border-2 shadow-card lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-xl">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">Career Copilot</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Chat with me to spin up your personalized roadmap.
                </p>
              </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`rounded-xl border border-dashed ${
              agentcoreStatus.available ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"
            } px-4 py-3 text-xs sm:text-sm text-foreground`}
          >
            <span className="font-semibold">
              AgentCore status:
            </span>{" "}
            {agentcoreStatus.message}
          </div>
          <div className="h-80 overflow-y-auto rounded-xl bg-secondary/40 p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[90%] rounded-xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    message.sender === "assistant"
                      ? "bg-white text-foreground border border-primary/20"
                      : "bg-gradient-primary text-primary-foreground ml-auto"
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="chat-input" className="text-sm font-medium">
                {goalConfirmed ? "Ask another question" : "Share your dream role"}
              </Label>
              <Textarea
                id="chat-input"
                placeholder={
                  goalConfirmed
                    ? "Share a little about your background so I can craft the plan..."
                    : "e.g., I want to become a consultant at MBB"
                }
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[110px] resize-none"
                disabled={introLoading || planLoading}
              />
              <Button
                onClick={handleSendMessage}
                className="w-full bg-gradient-primary"
                disabled={introLoading || planLoading}
              >
                {introLoading || planLoading
                  ? "Generating..."
                  : goalConfirmed
                  ? "Generate career plan"
                  : "Send"}
              </Button>
              {goalConfirmed && (
                <p className="text-xs text-muted-foreground">
                  Goal captured! Adjust it anytime in your profile. Complete the quick form on the right and click “Create my tailored roadmap” when ready.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-card bg-white/80">
          <CardHeader className="flex flex-col gap-4">
            <Button
              onClick={() => navigate("/profile")}
              className="w-full bg-gradient-primary text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
            >
              Profile / Sign in
            </Button>
            <div className="space-y-2">
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
                className="hidden"
              />
              <Button variant="secondary" className="w-full justify-center" onClick={handleResumeClick}>
                Upload résumé (optional)
              </Button>
              {resumeName && (
                <p className="text-xs text-muted-foreground text-center">
                  Attached: {resumeName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Quick Snapshot</CardTitle>
                <p className="text-sm text-muted-foreground">
                  These details help me tailor courses, projects, and internships for you.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>What describes your current status?</Label>
              <Select
                value={formState.studentYear}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, studentYear: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your current level" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courses">Key courses or experiences you've completed</Label>
              <Textarea
                id="courses"
                placeholder="List a few classes, certifications, or internships you've completed"
                value={formState.coursesTaken}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    coursesTaken: e.target.value,
                  }))
                }
                className="resize-none min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="about">Tell me about yourself</Label>
              <Textarea
                id="about"
                placeholder="Strengths, interests, or constraints (e.g., switching from finance, love healthcare, prefer remote roles)"
                value={formState.about}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, about: e.target.value }))
                }
                className="resize-none min-h-[120px]"
              />
            </div>

            <div className="space-y-3">
              <Label>Weekly time you can invest</Label>
              <Select
                value={formState.timeCommitment}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    timeCommitment: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time commitment" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">
                Email (optional, helps us save progress when you sign up)
              </Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="name@example.com"
                value={formState.contactEmail}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    contactEmail: e.target.value,
                  }))
                }
              />
            </div>

            <Button
              className="w-full bg-gradient-primary"
              onClick={handleGeneratePlan}
              disabled={!canGeneratePlan || planLoading}
            >
              {planLoading ? "Building your plan..." : "Create my tailored roadmap"}
            </Button>

            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-primary mt-0.5" />
              <span>
                Sign up or log in later and we'll keep your answers, projects, and course plan synced across devices.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
