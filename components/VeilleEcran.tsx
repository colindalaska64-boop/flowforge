"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Option « Voir l'écran ».
 *
 * Décochée, elle recouvre entièrement la page d'un carré noir. Aucun clic ni
 * aucune touche n'en sort : seul un rafraîchissement rétablit l'affichage.
 * L'état n'est volontairement pas enregistré, pour qu'un rechargement suffise
 * toujours à revenir.
 *
 * Le voile est rendu dans <body> via un portail. Rendu sur place, il ne
 * couvrirait que la carte : .glass-card applique un backdrop-filter, et un
 * ancêtre portant cette propriété devient le référent des positions fixes —
 * le « inset: 0 » se calait donc sur la carte, pas sur la fenêtre.
 */
export default function VeilleEcran() {
  const [visible, setVisible] = useState(true);
  const [monte, setMonte] = useState(false);

  // Le portail a besoin de document, absent au rendu serveur.
  useEffect(() => setMonte(true), []);

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

      {!visible &&
        monte &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2147483647,
              background: "#000",
            }}
          />,
          document.body
        )}
    </>
  );
}
