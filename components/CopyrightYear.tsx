"use client";

import { useEffect, useState } from "react";

/**
 * Affiche l'année courante dans les mentions de copyright.
 *
 * Les pages publiques sont pré-générées au build : l'année écrite dans le HTML
 * est donc celle du dernier déploiement. L'effet la recalcule dans le
 * navigateur, ce qui garde la mention juste même si le site n'est pas
 * redéployé après le 1er janvier.
 *
 * suppressHydrationWarning : le seul jour où le HTML pré-généré et le
 * navigateur ne sont pas d'accord, c'est justement celui du changement
 * d'année — l'effet corrige la valeur juste après.
 */
export default function CopyrightYear() {
  const [year, setYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    const current = new Date().getFullYear();
    setYear(prev => (prev === current ? prev : current));
  }, []);

  return <span suppressHydrationWarning>{year}</span>;
}
