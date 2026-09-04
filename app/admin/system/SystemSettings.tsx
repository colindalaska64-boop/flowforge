"use client";

import { useEffect, useState, useCallback } from "react";

type SystemSettings = {
  maintenance_mode: boolean;
  maintenance_message: string;
  maintenance_eta: string;
  global_banner_enabled: boolean;
  global_banner_text: string;
  global_banner_type: "info" | "warning" | "error";
  disabled_integrations: string[];
};

const ALL_INTEGRATIONS: { id: string; label: string; group: string }[] = [
  { id: "gmail", label: "Gmail", group: "Google" },
  { id: "sheets", label: "Google Sheets", group: "Google" },
  { id: "drive", label: "Google Drive", group: "Google" },
  { id: "calendar", label: "Google Calendar", group: "Google" },

  { id: "slack", label: "Slack", group: "Messagerie" },
  { id: "discord", label: "Discord", group: "Messagerie" },
  { id: "telegram", label: "Telegram", group: "Messagerie" },
  { id: "whatsapp", label: "WhatsApp", group: "Messagerie" },
  { id: "sms", label: "SMS / Twilio", group: "Messagerie" },

  { id: "notion", label: "Notion", group: "Données" },
  { id: "airtable", label: "Airtable", group: "Données" },

  { id: "twitter", label: "Twitter / X", group: "Réseaux" },
  { id: "linkedin", label: "LinkedIn", group: "Réseaux" },

  { id: "stripe", label: "Stripe", group: "Finance" },
  { id: "hubspot", label: "HubSpot", group: "Finance" },

  { id: "groq", label: "IA (Générer / Filtre / Réponse)", group: "IA" },
  { id: "stability", label: "Stability AI (Images)", group: "IA" },
  { id: "elevenlabs", label: "ElevenLabs (Voix)", group: "IA" },
  { id: "gemini", label: "Gemini AI", group: "IA" },
  { id: "video", label: "Génération vidéo", group: "IA" },

  { id: "http", label: "Requête HTTP", group: "Dev" },
  { id: "github", label: "GitHub", group: "Dev" },
  { id: "rss", label: "Flux RSS", group: "Dev" },
  { id: "typeform", label: "Typeform", group: "Dev" },
  { id: "resend", label: "Resend Email", group: "Dev" },
];

const GROUP_ORDER = ["Google", "Messagerie", "Données", "Réseaux", "Finance", "IA", "Dev"];

const BANNER_TYPES = [
  { value: "info", label: "Info", cls: "badge-accent" },
  { value: "warning", label: "Avertissement", cls: "badge-warn" },
  { value: "error", label: "Erreur", cls: "badge-err" },
] as const;

export default function SystemSettingsPanel() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/system");
      if (res.ok) setSettings(await res.json());
      else setError("Impossible de charger les réglages.");
    } catch {
      setError("Impossible de charger les réglages.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(key: keyof SystemSettings, value: SystemSettings[keyof SystemSettings]) {
    setSaving(key);
    setError(null);
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setSettings(prev => (prev ? { ...prev, [key]: value } : prev));
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
      } else {
        setError("La sauvegarde a échoué.");
      }
    } catch {
      setError("La sauvegarde a échoué.");
    } finally {
      setSaving(null);
    }
  }

  function toggleIntegration(id: string) {
    if (!settings) return;
    const current = settings.disabled_integrations;
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    save("disabled_integrations", next);
  }

  if (!settings) {
    return (
      <div className="card">
        <div className="empty">
          <p className="empty-title">{error ? "Erreur" : "Chargement…"}</p>
          {error && <p className="empty-sub">{error}</p>}
        </div>
      </div>
    );
  }

  const savedBadge = (key: string) =>
    saved === key ? <span className="badge badge-ok" style={{ marginLeft: ".5rem" }}>Sauvegardé</span> : null;

  const SaveButton = ({ k, onClick }: { k: string; onClick: () => void }) => (
    <button onClick={onClick} disabled={saving === k} className="btn btn-primary">
      {saving === k ? "…" : "Sauvegarder"}
    </button>
  );

  const disabledCount = settings.disabled_integrations.length;

  return (
    <div className="stack">
      <style>{`
        .toggle { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
        .toggle input { opacity: 0; width: 0; height: 0; }
        .toggle .slider { position: absolute; inset: 0; cursor: pointer; background: var(--a-border); border-radius: 24px; transition: .2s; }
        .toggle .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .2s; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
        .toggle input:checked + .slider { background: var(--a-accent); }
        .toggle input:checked + .slider:before { transform: translateX(20px); }
        .integ { display: flex; align-items: center; gap: .6rem; padding: .65rem .8rem; border-radius: 10px; cursor: pointer; background: var(--a-surface-2); border: 1.5px solid var(--a-border); transition: border-color .12s, background .12s; text-align: left; font-family: inherit; width: 100%; }
        .integ:hover { border-color: var(--a-accent-bd); }
        .integ.off { background: var(--a-err-bg); border-color: var(--a-err-bd); }
        .integ-chip { width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: .72rem; font-weight: 800; flex-shrink: 0; background: var(--a-accent-bg); color: var(--a-accent); }
        .integ.off .integ-chip { background: var(--a-err-bg); color: var(--a-err); }
        .field-row { display: flex; gap: .6rem; align-items: center; }
        .field-row .field { flex: 1; min-width: 0; }
      `}</style>

      {error && <p className="note note-err">{error}</p>}

      {/* ── Maintenance ── */}
      <div className="card">
        <div className="card-head">
          <p className="card-title">Mode maintenance</p>
          <span className={`badge ${settings.maintenance_mode ? "badge-err" : "badge-neutral"}`}>
            {settings.maintenance_mode ? "Actif" : "Inactif"}
          </span>
        </div>
        <div className="card-body stack">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: ".875rem" }}>Couper l&apos;accès à l&apos;application</p>
              <p style={{ fontSize: ".78rem", color: "var(--a-text-3)", marginTop: ".15rem" }}>
                Redirige tous les utilisateurs (sauf l&apos;admin) vers la page /maintenance.
              </p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={e => save("maintenance_mode", e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>

          {settings.maintenance_mode && (
            <p className="note note-warn">
              Le mode maintenance est actif : personne ne peut accéder au dashboard.
            </p>
          )}

          <div>
            <p className="section-label">Message affiché {savedBadge("maintenance_message")}</p>
            <div className="field-row">
              <input
                className="field"
                value={settings.maintenance_message}
                onChange={e => setSettings(p => (p ? { ...p, maintenance_message: e.target.value } : p))}
                placeholder="Maintenance en cours, nous revenons bientôt…"
              />
              <SaveButton k="maintenance_message" onClick={() => save("maintenance_message", settings.maintenance_message)} />
            </div>
          </div>

          <div>
            <p className="section-label">Retour estimé, optionnel {savedBadge("maintenance_eta")}</p>
            <div className="field-row">
              <input
                className="field"
                value={settings.maintenance_eta}
                onChange={e => setSettings(p => (p ? { ...p, maintenance_eta: e.target.value } : p))}
                placeholder="Ex : 30 minutes, demain 9h"
              />
              <SaveButton k="maintenance_eta" onClick={() => save("maintenance_eta", settings.maintenance_eta)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bannière ── */}
      <div className="card">
        <div className="card-head">
          <p className="card-title">Bannière globale</p>
          <span className={`badge ${settings.global_banner_enabled ? "badge-ok" : "badge-neutral"}`}>
            {settings.global_banner_enabled ? "Affichée" : "Masquée"}
          </span>
        </div>
        <div className="card-body stack">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: ".875rem" }}>Afficher un message dans le dashboard</p>
              <p style={{ fontSize: ".78rem", color: "var(--a-text-3)", marginTop: ".15rem" }}>
                Le message apparaît en haut de toutes les pages connectées.
              </p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.global_banner_enabled}
                onChange={e => save("global_banner_enabled", e.target.checked)}
              />
              <span className="slider" />
            </label>
          </div>

          <div>
            <p className="section-label">Texte de la bannière {savedBadge("global_banner_text")}</p>
            <div className="field-row">
              <input
                className="field"
                value={settings.global_banner_text}
                onChange={e => setSettings(p => (p ? { ...p, global_banner_text: e.target.value } : p))}
                placeholder="Ex : nouvelle intégration Stripe disponible"
              />
              <SaveButton k="global_banner_text" onClick={() => save("global_banner_text", settings.global_banner_text)} />
            </div>
          </div>

          <div>
            <p className="section-label">Type {savedBadge("global_banner_type")}</p>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
              {BANNER_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => save("global_banner_type", t.value)}
                  className={`btn btn-sm${settings.global_banner_type === t.value ? " btn-primary" : ""}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {settings.global_banner_enabled && settings.global_banner_text && (
            <div>
              <p className="section-label">Aperçu</p>
              <p
                className={`note ${settings.global_banner_type === "error" ? "note-err" : settings.global_banner_type === "warning" ? "note-warn" : "note-ok"}`}
                style={{ textAlign: "center", fontWeight: 600 }}
              >
                {settings.global_banner_text}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Kill switches ── */}
      <div className="card">
        <div className="card-head">
          <div>
            <p className="card-title">Coupe-circuits par intégration</p>
            <p style={{ fontSize: ".78rem", color: "var(--a-text-3)", marginTop: ".15rem" }}>
              Une intégration désactivée fait échouer immédiatement tous les workflows qui l&apos;utilisent.
            </p>
          </div>
          <span className={`badge ${disabledCount > 0 ? "badge-err" : "badge-ok"}`}>
            {disabledCount > 0 ? `${disabledCount} désactivée${disabledCount > 1 ? "s" : ""}` : "Tout actif"}
          </span>
        </div>
        <div className="card-body">
          {GROUP_ORDER.map(group => {
            const items = ALL_INTEGRATIONS.filter(i => i.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} style={{ marginBottom: "1.25rem" }}>
                <p className="section-label">{group}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: ".55rem" }}>
                  {items.map(integ => {
                    const off = settings.disabled_integrations.includes(integ.id);
                    return (
                      <button
                        key={integ.id}
                        type="button"
                        onClick={() => toggleIntegration(integ.id)}
                        className={`integ${off ? " off" : ""}`}
                        aria-pressed={off}
                      >
                        <span className="integ-chip">{integ.label.charAt(0).toUpperCase()}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              display: "block", fontSize: ".8rem", fontWeight: 600,
                              color: off ? "var(--a-err)" : "var(--a-text)",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}
                          >
                            {integ.label}
                          </span>
                          <span style={{ display: "block", fontSize: ".68rem", fontWeight: 700, letterSpacing: ".04em", color: off ? "var(--a-err)" : "var(--a-text-3)" }}>
                            {off ? "DÉSACTIVÉ" : "actif"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {disabledCount > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => save("disabled_integrations", [])} className="btn btn-danger btn-sm">
                Tout réactiver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
