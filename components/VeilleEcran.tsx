"use client";

import { useState } from "react";

/**
 * Option « Voir l'écran ».
 *
 * Un simple interrupteur, allumé par défaut. Il ne masque rien et ne
 * superpose rien : la version précédente posait un voile noir sur toute la
 * page, ce qui était bien trop intrusif pour une option de ce genre.
 */
export default function VeilleEcran() {
  const [actif, setActif] = useState(true);

  return (
    <div className="set-row">
      <div>
        <p className="set-row-title">Voir l&apos;écran</p>
        <p className="set-row-desc">
          {actif
            ? "Activé. Vous voyez actuellement l'écran."
            : "Désactivé. Et pourtant, vous lisez toujours cette phrase."}
        </p>
      </div>
      <label className="set-switch">
        <input
          type="checkbox"
          checked={actif}
          onChange={e => setActif(e.target.checked)}
          aria-label="Voir l'écran"
        />
        <span className="slider" />
      </label>
    </div>
  );
}
