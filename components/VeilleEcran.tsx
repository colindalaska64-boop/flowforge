"use client";

import { useEffect, useState } from "react";

/**
 * Mise en veille de l'écran.
 *
 * Pose un voile noir par-dessus la page, sans toucher aux couleurs de
 * l'application — contrairement à un thème sombre, qui exigerait que chaque
 * page utilise des variables plutôt que des couleurs écrites en dur.
 *
 * On en sort d'un clic, d'une touche, ou en rafraîchissant : l'état n'est pas
 * enregistré, donc un rechargement ramène toujours l'affichage normal.
 */
export default function VeilleEcran() {
  const [veille, setVeille] = useState(false);

  useEffect(() => {
    if (!veille) return;

    const sortir = () => setVeille(false);
    window.addEventListener("keydown", sortir);

    // Empêcher le défilement derrière le voile.
    const overflowInitial = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", sortir);
      document.body.style.overflow = overflowInitial;
    };
  }, [veille]);

  return (
    <>
      <div className="set-row">
        <div>
          <p className="set-row-title">Mettre l&apos;écran en veille</p>
          <p className="set-row-desc">
            Assombrit complètement l&apos;écran pour reposer les yeux. Cliquez n&apos;importe où,
            appuyez sur une touche, ou rafraîchissez la page pour revenir.
          </p>
        </div>
        <button
          onClick={() => setVeille(true)}
          style={{
            flexShrink: 0,
            padding: ".55rem 1.1rem",
            borderRadius: 9,
            fontSize: ".85rem",
            fontWeight: 700,
            fontFamily: "inherit",
            background: "#111827",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Activer
        </button>
      </div>

      {veille && (
        <div
          onClick={() => setVeille(false)}
          role="button"
          tabIndex={0}
          aria-label="Sortir de la veille"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "#000",
            cursor: "pointer",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "3rem",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.28)", fontSize: ".8rem", fontFamily: "inherit" }}>
            Cliquez ou appuyez sur une touche pour revenir
          </span>
        </div>
      )}
    </>
  );
}
