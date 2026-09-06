"use client";

import { useState } from "react";

/**
 * Option « Voir l'écran ».
 *
 * Décochée, elle recouvre entièrement la page d'un carré noir. Aucun clic ni
 * aucune touche n'en sort : seul un rafraîchissement rétablit l'affichage.
 *
 * L'état n'est volontairement pas enregistré, pour qu'un simple rechargement
 * suffise toujours à revenir en arrière.
 */
export default function VeilleEcran() {
  const [visible, setVisible] = useState(true);

  return (
    <>
      <div className="set-row">
        <p className="set-row-title">Voir l&apos;écran</p>
        <label className="set-switch">
          <input
            type="checkbox"
            checked={visible}
            onChange={e => setVisible(e.target.checked)}
            aria-label="Voir l'écran"
          />
          <span className="slider" />
        </label>
      </div>

      {!visible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483647,
            background: "#000",
          }}
        />
      )}
    </>
  );
}
