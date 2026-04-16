"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: "Publie",   color: "#16A34A", bg: "#DCFCE7" },
  flagged:   { label: "Signale",  color: "#D97706", bg: "#FEF3C7" },
  deleted:   { label: "Supprime", color: "#DC2626", bg: "#FEE2E2" },
};

export default function AdminTemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [templates, setTemplates]       = useState<Template[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({});
  const [filter, setFilter]             = useState<"flagged" | "published" | "deleted">("flagged");
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(1);
  const [actionId, setActionId]         = useState<number | null>(null);
  const [toast, setToast]               = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
  }, [status, router]);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/templates?status=${filter}&page=${pg}`);
      if (res.status === 403) { router.push("/admin/login"); return; }
      const data = await res.json();
      setTemplates(data.templates || []);
      setStatusCounts(data.statusCounts || {});
      setPage(data.page || 1);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, [filter, router]);

  useEffect(() => { if (status === "authenticated") load(1); }, [status, filter, load]);

  const moderate = async (id: number, action: "approve" | "flag" | "delete") => {
    setActionId(id);
    try {
      const res = await fetch("/api/admin/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Erreur."); return; }
      showToast(`Template ${action === "approve" ? "approuve" : action === "flag" ? "signale" : "supprime"}.`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      setStatusCounts(prev => {
        const next = { ...prev };
        const from = filter;
        const to = action === "approve" ? "published" : action === "flag" ? "flagged" : "deleted";
        if (next[from]) next[from]--;
        if (next[to] !== undefined) next[to]++; else next[to] = 1;
        return next;
      });
    } catch {
      showToast("Erreur reseau.");
    } finally {
      setActionId(null);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  if (status === "loading") return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#F9FAFB; }
        .action-btn { border:none; border-radius:8px; padding:.4rem .8rem; font-size:.78rem; font-weight:700; cursor:pointer; font-family:inherit; transition:opacity .15s; }
        .action-btn:disabled { opacity:.4; cursor:not-allowed; }
        .tpl-row { background:#fff; border:1px solid #E5E7EB; border-radius:12px; padding:1.25rem 1.5rem; transition:box-shadow .15s; }
        .tpl-row:hover { box-shadow:0 4px 16px rgba(0,0,0,.06); }
      `}</style>

      {toast && (
        <div style={{ position:"fixed", bottom:"1.5rem", left:"50%", transform:"translateX(-50%)", background:"#0A0A0A", color:"#fff", padding:".75rem 1.5rem", borderRadius:12, fontSize:".875rem", fontWeight:600, zIndex:9999, boxShadow:"0 8px 24px rgba(0,0,0,.2)", fontFamily:"Plus Jakarta Sans,sans-serif", whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}

      {/* Nav admin */}
      <nav style={{ padding:"1rem 2.5rem", background:"#fff", borderBottom:"1px solid #E5E7EB", display:"flex", alignItems:"center", gap:"2rem" }}>
        <span style={{ fontWeight:800, fontSize:"1rem", color:"#0A0A0A" }}>Admin</span>
        <div style={{ display:"flex", gap:".25rem" }}>
          {[
            { label:"Dashboard", href:"/admin" },
            { label:"Users", href:"/admin/users" },
            { label:"Templates", href:"/admin/templates" },
            { label:"System", href:"/admin/system" },
          ].map(item => (
            <a key={item.label} href={item.href} style={{ fontSize:".82rem", color:item.href==="/admin/templates"?"#4F46E5":"#6B7280", textDecoration:"none", padding:".35rem .7rem", borderRadius:7, fontWeight:item.href==="/admin/templates"?700:500, background:item.href==="/admin/templates"?"#EEF2FF":"transparent" }}>
              {item.label}
            </a>
          ))}
        </div>
        <div style={{ marginLeft:"auto", fontSize:".8rem", color:"#9CA3AF" }}>{session?.user?.email}</div>
      </nav>

      <main style={{ maxWidth:"1100px", margin:"0 auto", padding:"2.5rem 2rem" }}>

        <div style={{ marginBottom:"2rem", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <h1 style={{ fontSize:"1.5rem", fontWeight:800, letterSpacing:"-.03em", marginBottom:".3rem" }}>Moderation templates</h1>
            <p style={{ fontSize:".875rem", color:"#6B7280" }}>Gerez les templates communautaires signales ou publies.</p>
          </div>
        </div>

        {/* Compteurs */}
        <div style={{ display:"flex", gap:"1rem", marginBottom:"1.75rem", flexWrap:"wrap" }}>
          {(["flagged", "published", "deleted"] as const).map(s => {
            const info = STATUS_LABELS[s];
            const count = statusCounts[s] || 0;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{ display:"flex", alignItems:"center", gap:".6rem", padding:".6rem 1.1rem", border:`2px solid ${filter===s?info.color:"#E5E7EB"}`, borderRadius:10, background:filter===s?info.bg:"#fff", cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}
              >
                <span style={{ fontWeight:800, fontSize:"1.1rem", color:info.color }}>{count}</span>
                <span style={{ fontSize:".82rem", fontWeight:600, color:filter===s?info.color:"#6B7280" }}>{info.label}</span>
              </button>
            );
          })}
        </div>

        {/* Liste */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"4rem", color:"#9CA3AF" }}>Chargement...</div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem", color:"#9CA3AF", fontSize:".9rem" }}>
            Aucun template dans cette categorie.
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {templates.map(tpl => {
              const statusInfo = STATUS_LABELS[tpl.status] || STATUS_LABELS.published;
              return (
                <div key={tpl.id} className="tpl-row">
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>

                    {/* Infos */}
                    <div style={{ flex:1, minWidth:"240px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:".6rem", marginBottom:".4rem" }}>
                        <span style={{ fontSize:".92rem", fontWeight:800, color:"#0A0A0A" }}>{tpl.name}</span>
                        <span style={{ fontSize:".68rem", fontWeight:700, background:statusInfo.bg, color:statusInfo.color, padding:".15rem .5rem", borderRadius:100 }}>
                          {statusInfo.label}
                        </span>
                        {tpl.report_count > 0 && (
                          <span style={{ fontSize:".68rem", fontWeight:700, background:"#FEE2E2", color:"#DC2626", padding:".15rem .5rem", borderRadius:100 }}>
                            {tpl.report_count} signalement{tpl.report_count > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize:".8rem", color:"#6B7280", lineHeight:1.5, marginBottom:".5rem", maxWidth:"580px" }}>
                        {tpl.description.slice(0, 180)}{tpl.description.length > 180 ? "..." : ""}
                      </p>
                      <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                        <span style={{ fontSize:".75rem", color:"#9CA3AF" }}>par <strong>{tpl.user_name}</strong></span>
                        <span style={{ fontSize:".75rem", color:"#9CA3AF" }}>{tpl.category}</span>
                        <span style={{ fontSize:".75rem", color:"#9CA3AF" }}>{tpl.downloads} dl · {tpl.likes} likes</span>
                        <span style={{ fontSize:".75rem", color:"#9CA3AF" }}>#{tpl.id}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display:"flex", gap:".5rem", flexShrink:0, flexWrap:"wrap" }}>
                      <a
                        href={`/templates/${tpl.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display:"inline-flex", alignItems:"center", gap:".3rem", padding:".4rem .8rem", border:"1px solid #E5E7EB", borderRadius:8, fontSize:".78rem", fontWeight:700, color:"#374151", textDecoration:"none", background:"#fff" }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        Voir
                      </a>

                      {tpl.status !== "published" && (
                        <button
                          className="action-btn"
                          disabled={actionId === tpl.id}
                          onClick={() => moderate(tpl.id, "approve")}
                          style={{ background:"#DCFCE7", color:"#16A34A" }}
                        >
                          Approuver
                        </button>
                      )}
                      {tpl.status !== "flagged" && (
                        <button
                          className="action-btn"
                          disabled={actionId === tpl.id}
                          onClick={() => moderate(tpl.id, "flag")}
                          style={{ background:"#FEF3C7", color:"#D97706" }}
                        >
                          Signaler
                        </button>
                      )}
                      {tpl.status !== "deleted" && (
                        <button
                          className="action-btn"
                          disabled={actionId === tpl.id}
                          onClick={() => moderate(tpl.id, "delete")}
                          style={{ background:"#FEE2E2", color:"#DC2626" }}
                        >
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

        {/* Pagination simple */}
        {templates.length === 20 && (
          <div style={{ display:"flex", justifyContent:"center", gap:".75rem", marginTop:"2rem" }}>
            <button
              onClick={() => load(page - 1)}
              disabled={page <= 1}
              style={{ padding:".45rem 1rem", border:"1px solid #E5E7EB", borderRadius:8, background:"#fff", cursor:"pointer", fontFamily:"inherit", fontSize:".85rem", opacity:page<=1?.4:1 }}
            >
              Precedent
            </button>
            <span style={{ fontSize:".85rem", color:"#6B7280", padding:".45rem 0" }}>Page {page}</span>
            <button
              onClick={() => load(page + 1)}
              style={{ padding:".45rem 1rem", border:"1px solid #E5E7EB", borderRadius:8, background:"#fff", cursor:"pointer", fontFamily:"inherit", fontSize:".85rem" }}
            >
              Suivant
            </button>
          </div>
        )}
      </main>
    </>
  );
}
