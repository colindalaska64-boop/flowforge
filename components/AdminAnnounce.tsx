"use client";
import { useState } from "react";

export default function AdminAnnounce() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  async function handleSend() {
    if (!confirmed) { setConfirmed(true); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/announce", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Envoi impossible.");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setConfirmed(false);
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <p className="card-title">Email de lancement</p>
          <p style={{ fontSize: ".76rem", color: "var(--a-text-3)", marginTop: ".15rem" }}>
            Envoie l&apos;annonce officielle à tous les utilisateurs non bannis.
          </p>
        </div>
      </div>

      <div className="card-body">
        {result ? (
          <div className="note note-ok" style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <span style={{ flex: 1 }}>
              <strong>{result.sent} email{result.sent > 1 ? "s" : ""} envoyé{result.sent > 1 ? "s" : ""}</strong>
              {" "}sur {result.total}
              {result.failed > 0 && ` — ${result.failed} échec${result.failed > 1 ? "s" : ""}`}
            </span>
            <button onClick={() => setResult(null)} className="btn btn-sm">Fermer</button>
          </div>
        ) : (
          <>
            {error && <p className="note note-err mb">{error}</p>}

            {confirmed && (
              <p className="note note-warn mb">
                Cliquez à nouveau pour confirmer. Les emails partiront immédiatement et l&apos;envoi est irréversible.
              </p>
            )}

            <button
              onClick={handleSend}
              disabled={loading}
              className={confirmed ? "btn btn-danger" : "btn btn-primary"}
            >
              {loading ? "Envoi en cours…" : confirmed ? "Confirmer l'envoi" : "Envoyer l'annonce de lancement"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
