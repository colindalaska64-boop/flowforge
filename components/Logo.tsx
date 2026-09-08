import Link from "next/link";
import LogoMark from "./LogoMark";
import type { Variante } from "@/lib/marque";

/**
 * Le logo complet : la marque, le mot « Loopflo », et le lien vers l'accueil.
 *
 * Le dessin vient de lib/marque.ts via LogoMark — il n'est plus recopié ici,
 * sinon changer de logo demanderait de le redessiner à deux endroits.
 *
 * `variante` : « blanc » pour les fonds sombres (le mot passe en blanc aussi).
 */
export default function Logo({
  size = "md",
  variante = "couleur",
}: {
  size?: "sm" | "md" | "lg";
  variante?: Variante;
}) {
  const marque = { sm: 28, md: 36, lg: 44 };
  const texte = { sm: "1rem", md: "1.2rem", lg: "1.5rem" };
  const sombre = variante === "blanc";

  return (
    <Link
      href="/"
      style={{ display: "inline-flex", alignItems: "center", gap: ".6rem", textDecoration: "none" }}
    >
      <LogoMark size={marque[size]} variante={variante} />
      <span
        style={{
          fontWeight: 800,
          fontSize: texte[size],
          letterSpacing: "-0.03em",
          color: sombre ? "#FFFFFF" : "#0A0A0A",
        }}
      >
        Loop<span style={{ color: sombre ? "#A5B4FC" : "#4F46E5" }}>flo</span>
      </span>
    </Link>
  );
}
