"use client";
import { useState } from "react";

export default function MobileFallback() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{
      position: "fixed", bottom: 60, left: 8, right: 8, zIndex: 9999,
      background: "rgba(30,27,75,0.92)", backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      padding: ".55rem .85rem", borderRadius: 12,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".5rem",
      boxShadow: "0 4px 20px rgba(0,0,0,.3)"
    }}>
      <span style={{ fontSize: ".72rem", fontWeight: 500, color: "rgba(255,255,255,0.85)", fontFamily: "inherit", lineHeight: 1.4 }}>
        Utilisez le bouton <strong style={{ color: "#A5B4FC" }}>+ Bloc</strong> en bas pour ajouter des blocs.
      </span>
      <button onClick={() => setDismissed(true)} style={{
        background: "rgba(255,255,255,0.15)", border: "none", color: "rgba(255,255,255,0.7)",
        cursor: "pointer", fontSize: ".7rem", fontWeight: 600, padding: ".25rem .6rem",
        borderRadius: 6, flexShrink: 0, fontFamily: "inherit"
      }}>OK</button>
    </div>
  );
}
