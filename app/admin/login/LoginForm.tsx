"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ email }: { email: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"send" | "verify">("send");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/otp/send", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setStep("verify");
      else setError(d.error || "Envoi impossible.");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) router.replace("/admin");
      else setError(d.error || "Code invalide.");
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin admin-login">
      <style>{`
        .admin-login {
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh; padding: 1.5rem;
        }
        .login-card { width: 100%; max-width: 380px; }
        .login-mark {
          width: 40px; height: 40px; border-radius: 12px; margin: 0 auto .9rem;
          background: linear-gradient(135deg, var(--a-accent), var(--a-accent-2));
          display: flex; align-items: center; justify-content: center; color: #fff;
        }
        .code-input {
          width: 100%; text-align: center; font-size: 1.5rem; font-weight: 800;
          letter-spacing: .35em; padding: .8rem 1rem; text-indent: .35em;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
      `}</style>

      <div className="card login-card">
        <div className="card-body" style={{ padding: "2rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <div className="login-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z" />
              </svg>
            </div>
            <p style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-.02em" }}>Loopflo Admin</p>
            <p style={{ fontSize: ".82rem", color: "var(--a-text-3)", marginTop: ".2rem" }}>
              Accès protégé par un code envoyé par email
            </p>
          </div>

          {step === "send" ? (
            <>
              <p className="note note-ok mb" style={{ textAlign: "center" }}>
                Un code à 6 chiffres sera envoyé à<br />
                <strong>{email}</strong>
              </p>
              {error && <p className="note note-err mb">{error}</p>}
              <button onClick={sendCode} disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
                {loading ? "Envoi en cours…" : "Recevoir le code"}
              </button>
            </>
          ) : (
            <form onSubmit={verifyCode}>
              <p className="note note-ok mb" style={{ textAlign: "center" }}>
                Code envoyé à <strong>{email}</strong>, valable 10 minutes.
              </p>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
                aria-label="Code à six chiffres"
                className="field code-input mb"
              />
              {error && <p className="note note-err mb">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="btn btn-primary"
                style={{ width: "100%", marginBottom: ".6rem" }}
              >
                {loading ? "Vérification…" : "Accéder au panel"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("send"); setCode(""); setError(""); }}
                className="btn"
                style={{ width: "100%" }}
              >
                Renvoyer un code
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
