"use client";

import { useEffect, useState } from "react";

export type Theme = "clair" | "sombre" | "systeme";

const CLE = "loopflo-theme";

/** Applique le thème sur <html>, ce que globals.css lit via [data-theme]. */
export function appliquerTheme(theme: Theme) {
  const racine = document.documentElement;
  const sombre =
    theme === "sombre" ||
    (theme === "systeme" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (sombre) racine.setAttribute("data-theme", "dark");
  else racine.removeAttribute("data-theme");
}

export function lireTheme(): Theme {
  try {
    const v = localStorage.getItem(CLE);
    return v === "clair" || v === "sombre" || v === "systeme" ? v : "systeme";
  } catch {
    return "systeme";
  }
}

const OPTIONS: { id: Theme; label: string; desc: string }[] = [
  { id: "clair", label: "Clair", desc: "Toujours en clair." },
  { id: "sombre", label: "Sombre", desc: "Toujours en sombre." },
  { id: "systeme", label: "Système", desc: "Suit le réglage de votre appareil." },
];

/**
 * Sélecteur de thème.
 *
 * Le thème sombre était entièrement écrit dans globals.css mais aucun code ne
 * posait jamais l'attribut data-theme : il était donc inatteignable.
 */
export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("systeme");

  useEffect(() => {
    const actuel = lireTheme();
    setTheme(actuel);
    appliquerTheme(actuel);

    // Suivre les changements du système tant que « Système » est choisi.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const surChangement = () => { if (lireTheme() === "systeme") appliquerTheme("systeme"); };
    media.addEventListener("change", surChangement);
    return () => media.removeEventListener("change", surChangement);
  }, []);

  function choisir(nouveau: Theme) {
    setTheme(nouveau);
    try { localStorage.setItem(CLE, nouveau); } catch { /* navigation privée */ }
    appliquerTheme(nouveau);
  }

  return (
    <div className="set-choices">
      {OPTIONS.map(o => (
        <button
          key={o.id}
          onClick={() => choisir(o.id)}
          className={`set-choice${theme === o.id ? " is-active" : ""}`}
          aria-pressed={theme === o.id}
        >
          <span className="set-choice-label">{o.label}</span>
          <span className="set-choice-desc">{o.desc}</span>
        </button>
      ))}
    </div>
  );
}
