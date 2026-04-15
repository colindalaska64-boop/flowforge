"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type WorkflowPreview = { name: string; data: { nodes?: { data?: { label?: string } }[] } };

export default function SharedWorkflowPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [wf, setWf] = useState<WorkflowPreview | null>(null);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    fetch(`/api/workflows/import?token=${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setWf(d); })
      .catch(() => setError("Erreur de chargement."));
  }, [token]);

  async function handleImport() {
    setImporting(true);
    const res = await fetch("/api/workflows/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const d = await res.json();
    if (d.error === "Connectez-vous pour importer.") {
      router.push(`/login?redirect=/shared/${token}`);
      return;
    }
    if (d.id) {
      setImported(true);
      setTimeout(() => router.push(`/dashboard/workflows/new?id=${d.id}`), 1500);
    }
    setImporting(false);
  }

  const nodes = wf?.data?.nodes || [];
  const blockLabels = nodes.map((n: { data?: { label?: string } }) => n.data?.label).filter(Boolean);

  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#1E1B4B 0%,#0F172A 100%)",
      fontFamily: "'Plus Jakarta Sans','Helvetica Neue',sans-serif", padding: "2rem",
    }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <a href="/" style={{ textDecoration: "none", fontSize: "1.4rem", fontWeight: 900, color: "#fff", letterSpacing: "-.03em", display: "block", marginBottom: "2rem" }}>
          Loop<span style={{ color: "#818CF8" }}>flo</span>
        </a>

        {error ? (
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "2.5rem" }}>
            <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔗</p>
            <p style={{ color: "#F87171", fontWeight: 700, marginBottom: ".5rem" }}>Lien invalide</p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: ".85rem" }}>{error}</p>
          </div>
        ) : !wf ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: ".9rem" }}>Chargement…</p>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "2.5rem" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>

            <p style={{ fontSize: ".72rem", fontWeight: 700, color: "#818CF8", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".5rem" }}>
              Workflow partagé
            </p>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginBottom: "1.5rem", lineHeight: 1.3 }}>
              {wf.name}
            </h1>

            {/* Blocs */}
            {blockLabels.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", justifyContent: "center", marginBottom: "1.75rem" }}>
                {blockLabels.map((label, i) => (
                  <span key={i} style={{ fontSize: ".72rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", padding: ".25rem .65rem", borderRadius: 100 }}>
                    {label}
                  </span>
                ))}
              </div>
            )}

            {imported ? (
              <div style={{ background: "rgba(5,150,105,0.15)", border: "1px solid rgba(5,150,105,0.3)", borderRadius: 10, padding: ".85rem 1rem", color: "#34D399", fontWeight: 700, fontSize: ".9rem" }}>
                Importé ! Redirection…
              </div>
            ) : (
              <button
                onClick={handleImport}
                disabled={importing}
                style={{
                  width: "100%", padding: ".85rem 1.5rem", borderRadius: 12, fontSize: ".9rem", fontWeight: 700,
                  background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", border: "none",
                  cursor: importing ? "not-allowed" : "pointer", opacity: importing ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                {importing ? "Importation…" : "Importer ce workflow"}
              </button>
            )}

            <p style={{ marginTop: "1rem", fontSize: ".72rem", color: "rgba(255,255,255,0.3)" }}>
              Tu devras te connecter pour importer
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
