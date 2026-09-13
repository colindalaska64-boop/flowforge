import Link from "next/link";
import LogoMark from "@/components/LogoMark";

/**
 * Page 404.
 *
 * Volontairement sobre : la marque, le code d'erreur, et les deux seules
 * sorties utiles — l'accueil pour un visiteur, le tableau de bord pour
 * quelqu'un déjà connecté. La version précédente était une scène dessinée
 * avec un easter egg au clavier ; jolie, mais on tombe sur cette page parce
 * qu'on cherche autre chose, pas pour la regarder.
 *
 * Pas de "use client" : sans animation ni état, la page se rend côté serveur.
 */
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.25rem",
        textAlign: "center",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: "var(--c-text)",
      }}
    >
      <LogoMark size={56} />

      <p
        style={{
          fontSize: "clamp(3.5rem, 14vw, 5.5rem)",
          fontWeight: 900,
          letterSpacing: "-0.05em",
          lineHeight: 1,
          margin: "1.75rem 0 0",
          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        404
      </p>

      <h1
        style={{
          fontSize: "clamp(1.15rem, 4vw, 1.5rem)",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          margin: ".6rem 0 0",
        }}
      >
        Cette page n&apos;existe pas
      </h1>

      <p
        style={{
          fontSize: ".92rem",
          color: "var(--c-text2)",
          lineHeight: 1.65,
          margin: ".6rem 0 0",
          maxWidth: "26rem",
        }}
      >
        Le lien est peut-être erroné, ou la page a été déplacée.
      </p>

      <div
        style={{
          display: "flex",
          gap: ".7rem",
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: "2rem",
        }}
      >
        <Link
          href="/"
          style={{
            padding: ".75rem 1.5rem",
            borderRadius: 10,
            fontSize: ".9rem",
            fontWeight: 700,
            textDecoration: "none",
            color: "#fff",
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            boxShadow: "0 4px 16px rgba(99,102,241,0.30)",
          }}
        >
          Retour à l&apos;accueil
        </Link>

        <Link
          href="/dashboard"
          style={{
            padding: ".75rem 1.5rem",
            borderRadius: 10,
            fontSize: ".9rem",
            fontWeight: 700,
            textDecoration: "none",
            color: "var(--c-text)",
            background: "var(--c-card)",
            border: "1.5px solid var(--c-border)",
          }}
        >
          Mon tableau de bord
        </Link>
      </div>
    </main>
  );
}
