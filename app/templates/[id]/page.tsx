/**
 * /templates/[id]  — page publique d'un template communautaire
 * Accessible sans connexion. SEO-friendly (server component).
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import PublicTemplateClient from "./client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const row = await pool.query(
      "SELECT name, description FROM community_templates WHERE id = $1 AND status = 'published'",
      [parseInt(id)]
    );
    if (!row.rows.length) return { title: "Template introuvable" };
    return {
      title: `${row.rows[0].name} — Template Loopflo`,
      description: row.rows[0].description,
    };
  } catch {
    return { title: "Template Loopflo" };
  }
}

export default async function PublicTemplatePage({ params }: Props) {
  const { id } = await params;
  const templateId = parseInt(id);
  if (isNaN(templateId)) notFound();

  const result = await pool.query(
    `SELECT id, user_name, name, description, category, keywords, tools,
            config_time, configurable_blocks, downloads, likes, created_at
     FROM community_templates
     WHERE id = $1 AND status = 'published'`,
    [templateId]
  );
  if (!result.rows.length) notFound();

  const tpl = result.rows[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#F9FAFB; }
        @media (max-width:768px) {
          .pub-hero { padding: 2rem 1.25rem !important; }
          .pub-meta { flex-direction:column; gap:.5rem !important; }
        }
      `}</style>

      {/* Nav minimale */}
      <nav style={{ padding:"1rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#fff", borderBottom:"1px solid #F3F4F6", position:"sticky", top:0, zIndex:50 }}>
        <Link href="/" style={{ textDecoration:"none", fontWeight:800, fontSize:"1.1rem", color:"#0A0A0A", letterSpacing:"-.03em" }}>
          Loopflo
        </Link>
        <div style={{ display:"flex", gap:".75rem", alignItems:"center" }}>
          <Link href="/dashboard/templates" style={{ fontSize:".85rem", color:"#6B7280", textDecoration:"none", fontWeight:500 }}>
            Voir tous les templates
          </Link>
          <Link href="/login" style={{ fontSize:".85rem", background:"#4F46E5", color:"#fff", textDecoration:"none", fontWeight:700, padding:".45rem 1rem", borderRadius:9 }}>
            Se connecter
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pub-hero" style={{ maxWidth:"860px", margin:"0 auto", padding:"3.5rem 2rem 2rem" }}>

        {/* Breadcrumb */}
        <div style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".78rem", color:"#9CA3AF", marginBottom:"1.5rem" }}>
          <Link href="/dashboard/templates" style={{ color:"#9CA3AF", textDecoration:"none" }}>Templates</Link>
          <span>/</span>
          <span style={{ color:"#6B7280" }}>{tpl.category}</span>
          <span>/</span>
          <span style={{ color:"#0A0A0A", fontWeight:600 }}>{tpl.name}</span>
        </div>

        {/* Badge categorie */}
        <div style={{ marginBottom:"1rem" }}>
          <span style={{ fontSize:".72rem", fontWeight:700, background:"#EEF2FF", color:"#4F46E5", padding:".25rem .7rem", borderRadius:100, textTransform:"uppercase", letterSpacing:".07em" }}>
            {tpl.category}
          </span>
        </div>

        <h1 style={{ fontSize:"2rem", fontWeight:800, letterSpacing:"-.04em", lineHeight:1.2, marginBottom:"1rem", color:"#0A0A0A" }}>
          {tpl.name}
        </h1>

        <p style={{ fontSize:"1.05rem", color:"#4B5563", lineHeight:1.7, marginBottom:"1.75rem" }}>
          {tpl.description}
        </p>

        {/* Meta */}
        <div className="pub-meta" style={{ display:"flex", alignItems:"center", gap:"1.5rem", flexWrap:"wrap", marginBottom:"2rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", color:"#6B7280" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
            <span>par <strong>{tpl.user_name}</strong></span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", color:"#6B7280" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            <span><strong>{tpl.downloads}</strong> utilisation{tpl.downloads !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", color:"#6B7280" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span><strong>{tpl.likes}</strong> like{tpl.likes !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", color:"#6B7280" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>~<strong>{tpl.config_time} min</strong> de config</span>
          </div>
        </div>

        {/* Outils */}
        {(tpl.tools || []).length > 0 && (
          <div style={{ marginBottom:"2rem" }}>
            <p style={{ fontSize:".78rem", fontWeight:700, color:"#374151", marginBottom:".6rem", textTransform:"uppercase", letterSpacing:".06em" }}>Outils utilises</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:".5rem" }}>
              {(tpl.tools as string[]).map((tool, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:".35rem" }}>
                  <span style={{ fontSize:".82rem", fontWeight:700, background:"#F3F4F6", color:"#374151", border:"1px solid #E5E7EB", padding:".3rem .7rem", borderRadius:100 }}>{tool}</span>
                  {i < tpl.tools.length-1 && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M13 6l6 6-6 6" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blocs configurables */}
        {(tpl.configurable_blocks as Array<{label:string;fields:string[]}>)?.length > 0 && (
          <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:14, padding:"1.25rem 1.5rem", marginBottom:"2rem" }}>
            <p style={{ fontSize:".82rem", fontWeight:800, color:"#D97706", marginBottom:".75rem" }}>
              A configurer apres import
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:".5rem" }}>
              {(tpl.configurable_blocks as Array<{label:string;fields:string[]}>).map((b, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:".6rem" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#F59E0B", display:"inline-block", marginTop:5, flexShrink:0 }}/>
                  <span style={{ fontSize:".82rem", color:"#92400E" }}>
                    <strong>{b.label}</strong> : {b.fields.join(", ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {(tpl.keywords as string[])?.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:".4rem", marginBottom:"2.5rem" }}>
            {(tpl.keywords as string[]).map(kw => (
              <span key={kw} style={{ fontSize:".75rem", color:"#6B7280", background:"#F3F4F6", border:"1px solid #E5E7EB", padding:".2rem .55rem", borderRadius:6 }}>
                #{kw}
              </span>
            ))}
          </div>
        )}

        {/* CTA client (like + import) */}
        <PublicTemplateClient templateId={tpl.id} likes={tpl.likes} />

        {/* Footer SEO */}
        <div style={{ marginTop:"4rem", paddingTop:"2rem", borderTop:"1px solid #E5E7EB", textAlign:"center" }}>
          <p style={{ fontSize:".875rem", color:"#6B7280", marginBottom:".5rem" }}>
            Loopflo — automatisez vos workflows sans coder.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:"1.5rem" }}>
            <Link href="/dashboard/templates" style={{ fontSize:".82rem", color:"#4F46E5", textDecoration:"none" }}>Voir tous les templates</Link>
            <Link href="/register" style={{ fontSize:".82rem", color:"#4F46E5", textDecoration:"none" }}>Creer un compte gratuit</Link>
          </div>
        </div>
      </section>
    </>
  );
}
