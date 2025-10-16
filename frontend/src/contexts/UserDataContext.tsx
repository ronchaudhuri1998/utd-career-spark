import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserExperience {
  title: string;
  company: string;
  duration: string;
  description: string;
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
  bio: string;
  skills: string[];
  experience: UserExperience[];
  isOnboarded: boolean;
}

export interface SectionLoadingStates {
  jobMarket: boolean;
  projects: boolean;
  academics: boolean;
}

export type UserDataField = keyof UserData;
export type UserDataUpdate = Partial<UserData>;

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
}

const defaultUserData: UserData = {
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
  isOnboarded: false,
};

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

export const UserDataProvider: React.FC<UserDataProviderProps> = ({
  children,
}) => {
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [isLoading, setIsLoading] = useState(true);
  const [sectionLoading, setSectionLoadingState] =
    useState<SectionLoadingStates>({
      jobMarket: false,
      projects: false,
      academics: false,
    });

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const savedUserData = localStorage.getItem("userData");
        if (savedUserData) {
          const parsedData = JSON.parse(savedUserData);
          // Validate the data structure
          if (parsedData && typeof parsedData === "object") {
            setUserData({
              ...defaultUserData,
              ...parsedData,
              // Ensure arrays are arrays
              skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
              experience: Array.isArray(parsedData.experience)
                ? parsedData.experience
                : [],
            });
          }
        }
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        // Reset to default data if parsing fails
        setUserData(defaultUserData);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Save user data to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("userData", JSON.stringify(userData));
      } catch (error) {
        console.error("Error saving user data:", error);
      }
    }
  }, [userData, isLoading]);

  const updateUserData = (updates: UserDataUpdate) => {
    setUserData((prevData) => ({
      ...prevData,
      ...updates,
    }));
  };

  const setOnboarded = (onboarded: boolean) => {
    setUserData((prevData) => ({
      ...prevData,
      isOnboarded: onboarded,
    }));
  };

  const resetUserData = () => {
    setUserData(defaultUserData);
    localStorage.removeItem("userData");
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

  const value: UserDataContextType = {
    userData,
    updateUserData,
    setOnboarded,
    resetUserData,
    isLoading,
    sectionLoading,
    setSectionLoading,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};
