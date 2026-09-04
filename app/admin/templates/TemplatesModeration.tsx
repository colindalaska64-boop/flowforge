"use client";

import { useEffect, useState, useCallback } from "react";

type Template = {
  id: number;
  user_name: string;
  name: string;
  category: string;
  description: string;
  status: string;
  downloads: number;
  likes: number;
  report_count: number;
  created_at: string;
};

type StatusCounts = Record<string, number>;
type Filter = "flagged" | "published" | "deleted";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  published: { label: "Publié", cls: "badge-ok" },
  flagged: { label: "Signalé", cls: "badge-warn" },
  deleted: { label: "Supprimé", cls: "badge-err" },
};

const PAGE_SIZE = 20;

export default function TemplatesModeration() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [filter, setFilter] = useState<Filter>("flagged");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/templates?status=${filter}&page=${pg}`);
      if (!res.ok) {
        setError(res.status === 403
          ? "Accès refusé : ce compte n'a pas le drapeau is_admin en base."
          : "Impossible de charger les templates.");
        setTemplates([]);
        return;
      }
      const data = await res.json();
      setTemplates(data.templates || []);
      setStatusCounts(data.statusCounts || {});
      setPage(data.page || pg);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(1); }, [load]);

  const moderate = async (id: number, action: "approve" | "flag" | "delete") => {
    setActionId(id);
    try {
      const res = await fetch("/api/admin/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(data.error || "L'action a échoué."); return; }

      showToast(
        action === "approve" ? "Template approuvé."
          : action === "flag" ? "Template signalé."
            : "Template supprimé."
      );
      setTemplates(prev => prev.filter(t => t.id !== id));
      setStatusCounts(prev => {
        const next = { ...prev };
        const to = action === "approve" ? "published" : action === "flag" ? "flagged" : "deleted";
        if (next[filter]) next[filter]--;
        next[to] = (next[to] || 0) + 1;
        return next;
      });
    } catch {
      showToast("Erreur réseau.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      {toast && (
        <div
          style={{
            position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)",
            background: "var(--a-text)", color: "var(--a-bg)", padding: ".7rem 1.4rem",
            borderRadius: 12, fontSize: ".85rem", fontWeight: 600, zIndex: 9999,
            boxShadow: "var(--a-shadow-lg)", whiteSpace: "nowrap",
          }}
          role="status"
        >
          {toast}
        </div>
      )}

      {/* Filtres par statut */}
      <div className="kpi-grid">
        {(["flagged", "published", "deleted"] as const).map(s => {
          const info = STATUS_LABELS[s];
          const active = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="kpi"
              style={{
                textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                borderColor: active ? "var(--a-accent)" : "var(--a-border)",
                boxShadow: active ? "0 0 0 3px var(--a-accent-bg)" : "var(--a-shadow)",
              }}
              aria-pressed={active}
            >
              <p className="kpi-label">{info.label}</p>
              <p className="kpi-value">{statusCounts[s] || 0}</p>
            </button>
          );
        })}
      </div>

      {error && <p className="note note-err mb">{error}</p>}

      {loading ? (
        <div className="card"><div className="empty"><p className="empty-title">Chargement…</p></div></div>
      ) : templates.length === 0 ? (
        <div className="card">
          <div className="empty">
            <p className="empty-title">Aucun template</p>
            <p className="empty-sub">Rien à modérer dans la catégorie « {STATUS_LABELS[filter].label} ».</p>
          </div>
        </div>
      ) : (
        <div className="stack">
          {templates.map(tpl => {
            const info = STATUS_LABELS[tpl.status] || STATUS_LABELS.published;
            const busy = actionId === tpl.id;
            return (
              <div key={tpl.id} className="card">
                <div className="card-body" style={{ display: "flex", gap: "1rem", justifyContent: "space-between", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap", marginBottom: ".4rem" }}>
                      <span style={{ fontSize: ".92rem", fontWeight: 700 }}>{tpl.name}</span>
                      <span className={`badge ${info.cls}`}>{info.label}</span>
                      {tpl.report_count > 0 && (
                        <span className="badge badge-err">
                          {tpl.report_count} signalement{tpl.report_count > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: ".82rem", color: "var(--a-text-2)", lineHeight: 1.55, marginBottom: ".55rem", maxWidth: 620 }}>
                      {tpl.description?.slice(0, 200)}{tpl.description && tpl.description.length > 200 ? "…" : ""}
                    </p>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: ".74rem", color: "var(--a-text-3)" }}>
                      <span>par <strong>{tpl.user_name}</strong></span>
                      <span>{tpl.category}</span>
                      <span>{tpl.downloads} téléchargements · {tpl.likes} likes</span>
                      <span>#{tpl.id}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
                    <a href={`/templates/${tpl.id}`} target="_blank" rel="noreferrer" className="btn btn-sm">
                      Voir
                    </a>
                    {tpl.status !== "published" && (
                      <button className="btn btn-sm btn-ok" disabled={busy} onClick={() => moderate(tpl.id, "approve")}>
                        Approuver
                      </button>
                    )}
                    {tpl.status !== "flagged" && (
                      <button className="btn btn-sm" disabled={busy} onClick={() => moderate(tpl.id, "flag")}>
                        Signaler
                      </button>
                    )}
                    {tpl.status !== "deleted" && (
                      <button className="btn btn-sm btn-danger" disabled={busy} onClick={() => moderate(tpl.id, "delete")}>
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(page > 1 || templates.length === PAGE_SIZE) && (
        <div className="pagination" style={{ marginTop: "1.15rem" }}>
          <button className="btn btn-sm" disabled={page <= 1 || loading} onClick={() => load(page - 1)}>
            Précédent
          </button>
          <span>Page {page}</span>
          <button className="btn btn-sm" disabled={templates.length < PAGE_SIZE || loading} onClick={() => load(page + 1)}>
            Suivant
          </button>
        </div>
      )}
    </>
  );
}
