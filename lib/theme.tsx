"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("loopflo-theme") as Theme | null;
    const initial = saved ?? "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    setTheme(prev => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("loopflo-theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Tokens de couleur par thème — à utiliser dans les inline styles
export function useThemeColors() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  return {
    isDark: dark,
    text:    dark ? "#F3F4F6" : "#0A0A0A",
    text2:   dark ? "#9CA3AF" : "#6B7280",
    muted:   dark ? "#6B7280" : "#9CA3AF",
    border:  dark ? "#2A2A42" : "#E5E7EB",
    hover:   dark ? "#16162A" : "#F9FAFB",
    subtle:  dark ? "#1E1E38" : "#EEF2FF",
    card:    dark ? "rgba(22,22,40,0.92)" : "rgba(255,255,255,0.90)",
    input:   dark ? "rgba(28,28,48,0.85)" : "rgba(255,255,255,0.78)",
    overlay: dark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
    // Shorthand pour un fond blanc/sombre avec border
    surface: (alpha = 1) => dark
      ? `rgba(22,22,40,${alpha})`
      : `rgba(255,255,255,${alpha})`,
  };
}
