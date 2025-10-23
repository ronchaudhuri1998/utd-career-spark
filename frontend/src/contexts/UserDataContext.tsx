import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { toast } from "sonner";
import {
  generatePlan,
  AgentWorkflowResponse,
  PlanRequestExtras,
} from "@/lib/api";

export interface UserExperience {
  title: string;
  company: string;
  startDate?: string;
  endDate?: string;
  description: string;
  technologies?: string;
  location?: string;
}

export interface UserData {
  name: string;
  email: string;
  phone: string;
  location: string;
  graduationYear: string;
  major: string;
  gpa: string;
  careerGoal: string;
  studentYear: string;
  coursesTaken: string;
  timeCommitment: string;
  skills: string[];
  experience: UserExperience[];
  isOnboarded: boolean;
}

export interface SectionLoadingStates {
  jobMarket: boolean;
  projects: boolean;
  academics: boolean;
}

export interface AgentOutputs {
  finalPlan: string;
  jobMarket: string;
  coursePlan: string;
  projectRecommendations: string;
  trace: AgentWorkflowResponse["trace"];
  agentcore: AgentWorkflowResponse["agentcore"];
}

export type UserDataField = keyof UserData;
export type UserDataUpdate = Partial<UserData>;

const defaultUserData: UserData = {
  name: "",
  email: "",
  phone: "",
  location: "",
  graduationYear: "",
  major: "",
  gpa: "",
  careerGoal: "",
  studentYear: "",
  coursesTaken: "",
  timeCommitment: "",
  skills: [],
  experience: [],
  isOnboarded: false,
};

const defaultAgentOutputs: AgentOutputs = {
  finalPlan: "",
  jobMarket: "",
  coursePlan: "",
  projectRecommendations: "",
  trace: [],
  agentcore: {
    available: false,
    status: "AgentCore session not started yet.",
    memory_id: undefined,
    memory_name: undefined,
  },
};

interface UserDataContextType {
  userData: UserData;
  updateUserData: (updates: UserDataUpdate) => void;
  setOnboarded: (onboarded: boolean) => void;
  resetUserData: () => void;
  isLoading: boolean;
  sectionLoading: SectionLoadingStates;
  setSectionLoading: (
    section: keyof SectionLoadingStates,
    loading: boolean
  ) => void;
  agentOutputs: AgentOutputs;
  setAgentOutputs: (
    outputs: AgentOutputs | ((prev: AgentOutputs) => AgentOutputs)
  ) => void;
  sessionId: string;
  setSessionId: (id: string) => void;
  runAgentWorkflow: (
    goal: string,
    details?: Partial<{
      studentYear: string;
      coursesTaken: string;
      about: string;
      timeCommitment: string;
      contactEmail: string;
    }>
  ) => Promise<AgentWorkflowResponse | null>;
  resetAgentOutputs: () => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(
  undefined
);

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error("useUserData must be used within a UserDataProvider");
  }
  return context;
};

interface UserDataProviderProps {
  children: React.ReactNode;
}

const STORAGE_USER_KEY = "userData";
const STORAGE_OUTPUTS_KEY = "agentOutputs";
const STORAGE_SESSION_KEY = "agentSessionId";

export const UserDataProvider: React.FC<UserDataProviderProps> = ({
  children,
}) => {
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [agentOutputs, setAgentOutputs] =
    useState<AgentOutputs>(defaultAgentOutputs);
  const [sessionId, setSessionIdState] = useState<string>("");
  const [sessionContextInitialized, setSessionContextInitialized] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sectionLoading, setSectionLoadingState] =
    useState<SectionLoadingStates>({
      jobMarket: false,
      projects: false,
      academics: false,
    });

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const savedUserData = localStorage.getItem(STORAGE_USER_KEY);
      const savedAgentOutputs = localStorage.getItem(STORAGE_OUTPUTS_KEY);
      const savedSessionId = localStorage.getItem(STORAGE_SESSION_KEY) || "";

      if (savedUserData) {
        const parsed = JSON.parse(savedUserData);
        if (parsed && typeof parsed === "object") {
          setUserData({
            ...defaultUserData,
            ...parsed,
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            experience: Array.isArray(parsed.experience)
              ? parsed.experience
              : [],
          });
        }
      }

      if (savedAgentOutputs) {
        const parsedOutputs = JSON.parse(savedAgentOutputs);
        setAgentOutputs({
          ...defaultAgentOutputs,
          ...parsedOutputs,
        });
      }

      if (savedSessionId) {
        setSessionIdState(savedSessionId);
      }
    } catch (error) {
      console.error("Error hydrating state from storage:", error);
      setUserData(defaultUserData);
      setAgentOutputs(defaultAgentOutputs);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist user data changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
      } catch (error) {
        console.error("Error saving user data:", error);
      }
    }
  }, [userData, isLoading]);

  // Persist agent output changes
  useEffect(() => {
    if (!isLoading) {
      try {
        const outputsToSave = JSON.stringify(agentOutputs);
        localStorage.setItem(STORAGE_OUTPUTS_KEY, outputsToSave);
        console.log("💾 Agent outputs saved to localStorage:", {
          jobMarketLength: agentOutputs.jobMarket.length,
          coursePlanLength: agentOutputs.coursePlan.length,
          projectRecommendationsLength:
            agentOutputs.projectRecommendations.length,
          finalPlanLength: agentOutputs.finalPlan.length,
          storageKey: STORAGE_OUTPUTS_KEY,
          savedBytes: outputsToSave.length,
        });
      } catch (error) {
        console.error("❌ Error saving agent outputs to localStorage:", error);
      }
    }
  }, [agentOutputs, isLoading]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(STORAGE_SESSION_KEY, sessionId);
    }
  }, [sessionId]);

  // Reset context flag when session changes
  useEffect(() => {
    setSessionContextInitialized(false);
  }, [sessionId]);

  const updateUserData = (updates: UserDataUpdate) => {
    setUserData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const setOnboarded = (onboarded: boolean) => {
    setUserData((prev) => ({
      ...prev,
      isOnboarded: onboarded,
    }));
  };

  const resetAgentOutputs = useCallback(() => {
    setAgentOutputs(defaultAgentOutputs);
    localStorage.removeItem(STORAGE_OUTPUTS_KEY);
  }, []);

  const resetUserData = () => {
    setUserData(defaultUserData);
    localStorage.removeItem(STORAGE_USER_KEY);
    resetAgentOutputs();
  };

  const setSectionLoading = (
    section: keyof SectionLoadingStates,
    loading: boolean
  ) => {
    setSectionLoadingState((prev) => ({
      ...prev,
      [section]: loading,
    }));
  };

  const setSessionId = (id: string) => {
    setSessionIdState(id);
  };

  const runAgentWorkflow = async (
    goal: string,
    details?: Partial<{
      studentYear: string;
      coursesTaken: string;
      about: string;
      timeCommitment: string;
      contactEmail: string;
    }>
  ): Promise<AgentWorkflowResponse | null> => {
    if (!goal.trim()) {
      toast.error("Please provide a goal before running the agents.");
      return null;
    }

    setSectionLoadingState({
      jobMarket: true,
      projects: true,
      academics: true,
    });

    try {
      // Build complete user context
      const extras: PlanRequestExtras = {
        user_name: userData.name,
        user_email: userData.email,
        user_phone: userData.phone,
        user_location: userData.location,
        user_major: userData.major,
        graduation_year: userData.graduationYear,
        gpa: userData.gpa,
        career_goal: userData.careerGoal,
        student_year:
          details?.studentYear ??
          userData.studentYear ??
          userData.graduationYear ??
          "",
        courses_taken: details?.coursesTaken ?? userData.coursesTaken ?? "",
        time_commitment:
          details?.timeCommitment ?? userData.timeCommitment ?? "",
        skills: userData.skills.join(", "),
        experience: JSON.stringify(userData.experience),
        // Legacy fields for backward compatibility
        about: details?.about ?? userData.careerGoal ?? "",
        contact_email: details?.contactEmail ?? userData.email ?? "",
      };

      // Only send context on first message
      if (!sessionContextInitialized) {
        console.log("🔧 FRONTEND: Sending full user context to backend:");
        console.log("   User context:", extras);
      } else {
        console.log(
          "🔧 FRONTEND: Skipping user context (already sent for this session)"
        );
      }

      const response = await generatePlan(
        goal,
        sessionId || undefined,
        sessionContextInitialized ? undefined : extras
      );

      // Mark context as sent
      setSessionContextInitialized(true);
      setAgentOutputs({
        finalPlan: response.final_plan ?? "",
        jobMarket: response.job_market ?? "",
        coursePlan: response.course_plan ?? "",
        projectRecommendations: response.project_recommendations ?? "",
        trace: response.trace ?? [],
        agentcore: response.agentcore ?? {
          available: false,
          status: "AgentCore response unavailable.",
        },
      });
      if (response.session_id) {
        setSessionIdState(response.session_id);
      }
      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Agent workflow failed";
      toast.error(message);
      throw error;
    } finally {
      setSectionLoadingState({
        jobMarket: false,
        projects: false,
        academics: false,
      });
    }
  };

  return (
    <UserDataContext.Provider
      value={{
        userData,
        updateUserData,
        setOnboarded,
        resetUserData,
        isLoading,
        sectionLoading,
        setSectionLoading,
        agentOutputs,
        setAgentOutputs,
        sessionId,
        setSessionId,
        runAgentWorkflow,
        resetAgentOutputs,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};
