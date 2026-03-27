"use client";
import { useState } from "react";

export default function MobileFallback() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
      background: "#1e1b4b", padding: ".65rem 1rem",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".75rem",
      boxShadow: "0 2px 12px rgba(0,0,0,.2)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A5B4FC" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        <span style={{ fontSize: ".78rem", fontWeight: 500, color: "rgba(255,255,255,0.85)", fontFamily: "inherit" }}>
          L&apos;éditeur est optimisé pour PC — vous pouvez quand même continuer.
        </span>
      </div>
      <button onClick={() => setDismissed(true)} style={{
        background: "none", border: "none", color: "rgba(255,255,255,0.5)",
        cursor: "pointer", fontSize: "1.2rem", lineHeight: 1, padding: 0, flexShrink: 0
      }}>×</button>
    </div>
  );
}
