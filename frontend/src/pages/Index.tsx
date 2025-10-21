import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingModal from "@/components/OnboardingModal";

const Index = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if profile info exists in localStorage
    const userDataString = localStorage.getItem("userData");

    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);

        // Check if user has completed onboarding by verifying key fields
        const hasProfile =
          userData.isOnboarded || (userData.careerGoal && userData.major);

        if (hasProfile) {
          navigate("/dashboard", { replace: true });
        } else {
          // Show onboarding modal
          setShowOnboarding(true);
          setIsChecking(false);
        }
      } catch (error) {
        // If parsing fails, show onboarding
        console.error("Error parsing userData from localStorage:", error);
        setShowOnboarding(true);
        setIsChecking(false);
      }
    } else {
      // No userData found, show onboarding
      setShowOnboarding(true);
      setIsChecking(false);
    }
  }, [navigate]);

  const handleOnboardingClose = () => {
    // If they close without completing, navigate to dashboard anyway
    navigate("/dashboard", { replace: true });
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <OnboardingModal open={showOnboarding} onClose={handleOnboardingClose} />
      {!showOnboarding && (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Index;
