"use client";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      onClick={toggle}
      title={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        borderRadius: 9,
        border: `1.5px solid ${dark ? "#2A2A42" : "#E5E7EB"}`,
        background: dark ? "rgba(28,28,50,0.85)" : "rgba(255,255,255,0.78)",
        cursor: "pointer",
        transition: "all 0.2s",
        color: dark ? "#A78BFA" : "#6366F1",
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = dark
          ? "rgba(40,40,70,0.95)"
          : "rgba(238,242,255,0.95)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = dark
          ? "rgba(28,28,50,0.85)"
          : "rgba(255,255,255,0.78)";
      }}
    >
      {dark
        ? <Sun size={15} strokeWidth={2} />
        : <Moon size={15} strokeWidth={2} />
      }
    </button>
  );
}
