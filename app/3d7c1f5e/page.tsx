import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "...",
  robots: { index: false, follow: false },
};

export default function Portail() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#ffffff",
      fontFamily: "monospace",
      padding: "2rem",
    }}>
      <div style={{ maxWidth: 500, textAlign: "center", lineHeight: 2 }}>
        <p style={{ fontSize: "1.1rem", color: "#111" }}>
          waaa tout ça attendu
        </p>
        <p style={{ fontSize: "1rem", color: "#333", marginTop: "1.5rem" }}>
          envoie moi un mp sur discord <strong>&quot;Alaska64&quot;</strong> avec le message
        </p>
        <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111", letterSpacing: "0.1em", marginTop: "0.5rem" }}>
          E5-7gO9@15DR
        </p>
        <p style={{ fontSize: "1rem", color: "#333", marginTop: "1rem" }}>
          et tu recevra la suite de l&apos;enquête
        </p>
      </div>
    </main>
  );
}
