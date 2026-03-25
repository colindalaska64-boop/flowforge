"use client";
import { useState } from "react";

export default function AdminAnnounce() {
  const [target, setTarget] = useState<"all" | "users" | "waitlist">("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; users: number; waitlist: number } | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  async function handleSend() {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setConfirmed(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
      setConfirmed(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", marginTop: "2rem" }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA", display: "flex", alignItems: "center", gap: ".75rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#fff" strokeWidth="1.8"/><path d="M2 6L12 13L22 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: ".95rem", color: "#0A0A0A" }}>Email de lancement officiel</p>
          <p style={{ fontSize: ".78rem", color: "#9CA3AF", marginTop: ".1rem" }}>Envoie l&apos;annonce de lancement à tous vos contacts</p>
        </div>
      </div>
      <div style={{ padding: "1.5rem" }}>
        {result ? (
          <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: ".75rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div>
              <p style={{ fontWeight: 700, color: "#065F46", fontSize: ".9rem" }}>
                {result.sent} email{result.sent > 1 ? "s" : ""} envoyé{result.sent > 1 ? "s" : ""} avec succès
              </p>
              <p style={{ fontSize: ".78rem", color: "#059669", marginTop: ".2rem" }}>
                {result.users} utilisateur{result.users > 1 ? "s" : ""} · {result.waitlist} waitlist
              </p>
            </div>
            <button onClick={() => setResult(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: ".82rem", fontFamily: "inherit" }}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ fontSize: ".82rem", fontWeight: 600, color: "#374151", marginBottom: ".6rem" }}>Envoyer à :</p>
              <div style={{ display: "flex", gap: ".5rem" }}>
                {([
                  { value: "all", label: "Tous (users + waitlist)" },
                  { value: "users", label: "Utilisateurs seulement" },
                  { value: "waitlist", label: "Waitlist seulement" },
                ] as const).map(opt => (
                  <button key={opt.value} onClick={() => { setTarget(opt.value); setConfirmed(false); }} style={{ padding: ".4rem .85rem", borderRadius: 8, fontSize: ".8rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: `1px solid ${target === opt.value ? "#4F46E5" : "#E5E7EB"}`, background: target === opt.value ? "#EEF2FF" : "#fff", color: target === opt.value ? "#4F46E5" : "#6B7280" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p style={{ fontSize: ".82rem", color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", padding: ".6rem .9rem", borderRadius: 8, marginBottom: "1rem" }}>
                {error}
              </p>
            )}

            {confirmed && (
              <div style={{ background: "#FFF7ED", border: "1px solid #FDE68A", borderRadius: 8, padding: ".75rem 1rem", marginBottom: "1rem", fontSize: ".82rem", color: "#92400E", fontWeight: 500 }}>
                Cliquez encore une fois pour confirmer l&apos;envoi. Cette action est irréversible.
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={loading}
              style={{ padding: ".65rem 1.5rem", borderRadius: 9, fontSize: ".875rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", border: "none", background: confirmed ? "#DC2626" : "#4F46E5", color: "#fff", display: "flex", alignItems: "center", gap: ".5rem", opacity: loading ? .7 : 1 }}
            >
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}><circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20"/></svg>
                  Envoi en cours...
                </>
              ) : confirmed ? "Confirmer l\'envoi" : "Envoyer l\'annonce de lancement"}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}
      </div>
    </div>
  );
}
