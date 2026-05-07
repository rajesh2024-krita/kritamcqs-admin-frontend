import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "krita_admin_theme";
const ThemeContext = createContext(null);

function getSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    if (typeof window === "undefined") return "system";
    return localStorage.getItem(STORAGE_KEY) || "system";
  });
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystemTheme(mediaQuery.matches ? "dark" : "light");

    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const nextTheme = preference === "system" ? systemTheme : preference;
    applyTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, preference);
    }
  }, [preference, systemTheme]);

  const value = useMemo(
    () => ({
      themePreference: preference,
      resolvedTheme: preference === "system" ? systemTheme : preference,
      setThemePreference: setPreference,
    }),
    [preference, systemTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useThemePreference must be used within ThemeProvider");
  return context;
}
