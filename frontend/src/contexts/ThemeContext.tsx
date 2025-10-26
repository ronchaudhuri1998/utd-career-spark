import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeName = "sunrise" | "ember";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "career-spark-theme";

const readStoredTheme = (): ThemeName => {
  if (typeof window === "undefined") {
    return "sunrise";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeName | null;
  return stored === "ember" || stored === "sunrise" ? stored : "sunrise";
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<ThemeName>(readStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "ember") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((prev) => (prev === "sunrise" ? "ember" : "sunrise")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeProvider");
  }
  return context;
};
