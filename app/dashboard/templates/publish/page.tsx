"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Logo from "@/components/Logo";
import { detectSensitiveFields } from "@/lib/templateSanitizer";
import { TEMPLATE_CATEGORIES } from "@/lib/templateValidator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Workflow = {
  id: number;
  name: string;
  data: { nodes?: Node[]; edges?: unknown[] };
};

type Node = {
  id: string;
  type?: string;
  data?: { label?: string; config?: Record<string, unknown> };
};

type SensitiveBlock = {
  nodeId: string;
  label: string;
  sensitiveFields: string[];
  allFields: string[];
};

type ConfigurableBlock = {
  nodeId: string;
  label: string;
  fields: string[];
};

// ---------------------------------------------------------------------------
// Page Publier un template
// ---------------------------------------------------------------------------
export default function PublishTemplatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Étape : "select" | "configure"
  const [step, setStep] = useState<"select" | "configure">("select");

  // Liste workflows utilisateur
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loadingWf, setLoadingWf] = useState(true);

  // Workflow sélectionné
  const [selectedWf, setSelectedWf] = useState<Workflow | null>(null);

  // Formulaire
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]       = useState(TEMPLATE_CATEGORIES[0]);
  const [keywords, setKeywords]       = useState<string[]>([]);
  const [kwInput, setKwInput]         = useState("");
  const [configTime, setConfigTime]   = useState(5);

  // Blocs configurables : user coche les champs que l'importeur devra remplir
  const [configurableBlocks, setConfigurableBlocks] = useState<ConfigurableBlock[]>([]);

  // Soumission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/workflows")
      .then(r => r.json())
      .then(data => setWorkflows(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingWf(false));
  }, [status]);

  // Calcule les champs sensibles détectés dans le workflow sélectionné
  const sensitiveBlocks: SensitiveBlock[] = useMemo(() => {
    if (!selectedWf?.data) return [];
    return detectSensitiveFields(selectedWf.data);
  }, [selectedWf]);

  // Quand un workflow est choisi, pré-cocher tous les champs sensibles
  useEffect(() => {
    if (!selectedWf) { setConfigurableBlocks([]); return; }
    const blocks: ConfigurableBlock[] = sensitiveBlocks.map(b => ({
      nodeId: b.nodeId,
      label: b.label,
      fields: [...b.sensitiveFields],
    }));
    setConfigurableBlocks(blocks);
    setName(selectedWf.name);
  }, [selectedWf, sensitiveBlocks]);

  const toggleField = (nodeId: string, label: string, field: string, allFields: string[]) => {
    setConfigurableBlocks(prev => {
      const existing = prev.find(b => b.nodeId === nodeId);
      if (existing) {
        const hasField = existing.fields.includes(field);
        const newFields = hasField
          ? existing.fields.filter(f => f !== field)
          : [...existing.fields, field];
        if (newFields.length === 0) return prev.filter(b => b.nodeId !== nodeId);
        return prev.map(b => b.nodeId === nodeId ? { ...b, fields: newFields } : b);
      } else {
        return [...prev, { nodeId, label, fields: [field] }];
      }
    });
    void allFields; // utilisé par le parent pour afficher tous les champs
  };

  const isFieldChecked = (nodeId: string, field: string) =>
    configurableBlocks.find(b => b.nodeId === nodeId)?.fields.includes(field) ?? false;

  const addKeyword = () => {
    const kw = kwInput.trim().toLowerCase();
    if (!kw || keywords.includes(kw) || keywords.length >= 10) return;
    setKeywords(prev => [...prev, kw]);
    setKwInput("");
  };

  const removeKeyword = (kw: string) => setKeywords(prev => prev.filter(k => k !== kw));

  const handleSubmit = async () => {
    if (!selectedWf) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/community-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          keywords,
          configTime,
          workflowData: selectedWf.data,
          configurableBlocks,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erreur serveur."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/templates?tab=communaute"), 2000);
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") return null;

  // ---------------------------------------------------------------------------
  // Succès
  // ---------------------------------------------------------------------------
  if (success) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Plus Jakarta Sans,sans-serif" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:64, height:64, background:"#DCFCE7", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1.25rem" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2 style={{ fontSize:"1.25rem", fontWeight:800, marginBottom:".5rem" }}>Template publie !</h2>
          <p style={{ color:"#6B7280", fontSize:".9rem" }}>Redirection vers la communaute...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Plus Jakarta Sans',sans-serif; }
        .wf-option { border:2px solid #E5E7EB; border-radius:12px; padding:1rem 1.25rem; cursor:pointer; transition:all .15s; background:#fff; }
        .wf-option:hover { border-color:#4F46E5; background:#FAFAFE; }
        .wf-option.selected { border-color:#4F46E5; background:#EEF2FF; }
        .field-check { display:flex; align-items:center; gap:.5rem; padding:.35rem .6rem; border-radius:8px; cursor:pointer; transition:background .1s; }
        .field-check:hover { background:#F3F4F6; }
        input[type=text], textarea, select { font-family:inherit; }
        .pub-input { width:100%; border:1px solid #E5E7EB; border-radius:10px; padding:.6rem .9rem; font-size:.875rem; outline:none; transition:border-color .15s; resize:vertical; }
        .pub-input:focus { border-color:#4F46E5; }
        .kw-chip { display:inline-flex; align-items:center; gap:.35rem; background:#EEF2FF; color:#4F46E5; border-radius:100px; padding:.25rem .65rem; font-size:.75rem; font-weight:700; }
        .submit-btn { width:100%; background:#4F46E5; color:#fff; border:none; border-radius:12px; padding:.8rem; font-size:.95rem; font-weight:800; cursor:pointer; font-family:inherit; transition:background .15s; }
        .submit-btn:hover:not(:disabled) { background:#4338CA; }
        .submit-btn:disabled { opacity:.5; cursor:not-allowed; }
        @media (max-width:900px) {
          .pub-layout { flex-direction:column!important; }
          .pub-col { min-width:unset!important; }
        }
      `}</style>

      <nav className="glass-nav" style={{ padding:"1rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1.25rem" }}>
          <Logo />
          <a href="/dashboard/templates" style={{ fontSize:".82rem", color:"#6B7280", textDecoration:"none", display:"flex", alignItems:"center", gap:".3rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Templates
          </a>
        </div>
        <span style={{ fontSize:".82rem", color:"#9CA3AF" }}>{session?.user?.email}</span>
      </nav>

      <main style={{ maxWidth:"1100px", margin:"0 auto", padding:"3rem 2rem" }}>
        <div style={{ marginBottom:"2.5rem" }}>
          <h1 style={{ fontSize:"1.7rem", fontWeight:800, letterSpacing:"-.03em", marginBottom:".4rem" }}>Publier un template</h1>
          <p style={{ fontSize:".9rem", color:"#6B7280" }}>Partagez un de vos workflows avec la communaute. Les donnees sensibles seront automatiquement effacees.</p>
        </div>

        <div className="pub-layout" style={{ display:"flex", gap:"2.5rem", alignItems:"flex-start" }}>

          {/* ================================================================
              COLONNE GAUCHE — Choisir le workflow + champs configurables
          ================================================================ */}
          <div className="pub-col" style={{ flex:"1 1 420px", minWidth:"340px" }}>

            {/* Choix workflow */}
            <div className="glass-card" style={{ borderRadius:16, padding:"1.5rem", marginBottom:"1.5rem" }}>
              <h2 style={{ fontSize:"1rem", fontWeight:800, marginBottom:"1rem" }}>
                1. Choisir un workflow
              </h2>
              {loadingWf ? (
                <p style={{ fontSize:".85rem", color:"#9CA3AF" }}>Chargement...</p>
              ) : workflows.length === 0 ? (
                <p style={{ fontSize:".85rem", color:"#9CA3AF" }}>Vous n&apos;avez pas encore de workflow actif. <a href="/dashboard" style={{ color:"#4F46E5" }}>Creez-en un</a>.</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:".6rem" }}>
                  {workflows.map(wf => (
                    <button
                      key={wf.id}
                      className={`wf-option${selectedWf?.id === wf.id ? " selected" : ""}`}
                      onClick={() => setSelectedWf(wf)}
                    >
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span style={{ fontSize:".875rem", fontWeight:700, color: selectedWf?.id===wf.id?"#4F46E5":"#0A0A0A" }}>{wf.name}</span>
                        <span style={{ fontSize:".72rem", color:"#9CA3AF" }}>{(wf.data?.nodes || []).length} bloc{(wf.data?.nodes||[]).length!==1?"s":""}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Champs configurables */}
            {selectedWf && (
              <div className="glass-card" style={{ borderRadius:16, padding:"1.5rem" }}>
                <h2 style={{ fontSize:"1rem", fontWeight:800, marginBottom:".4rem" }}>
                  2. Champs a configurer
                </h2>
                <p style={{ fontSize:".8rem", color:"#6B7280", marginBottom:"1rem", lineHeight:1.55 }}>
                  Cochez les champs que chaque utilisateur devra remplir apres avoir importe le template.
                  Les champs sensibles sont pre-coches automatiquement.
                </p>

                {sensitiveBlocks.length === 0 && (selectedWf.data?.nodes||[]).length > 0 ? (
                  <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:".85rem 1rem", fontSize:".82rem", color:"#16A34A", fontWeight:600 }}>
                    Aucun champ sensible detecte — le template est propre.
                  </div>
                ) : null}

                {(selectedWf.data?.nodes || []).map((node: Node) => {
                  const label = node.data?.label || node.type || "Bloc";
                  const config = node.data?.config;
                  if (!config || Object.keys(config).length === 0) return null;
                  const allFields = Object.keys(config);
                  const isSensitiveBlock = sensitiveBlocks.find(b => b.nodeId === node.id);

                  return (
                    <div key={node.id} style={{ marginBottom:"1.25rem" }}>
                      <div style={{ fontSize:".8rem", fontWeight:700, color:"#374151", marginBottom:".4rem", display:"flex", alignItems:"center", gap:".4rem" }}>
                        <span style={{ width:7, height:7, borderRadius:"50%", background: isSensitiveBlock?"#F59E0B":"#D1D5DB", display:"inline-block" }}/>
                        {label}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:".1rem", paddingLeft:".75rem" }}>
                        {allFields.map(field => {
                          const checked = isFieldChecked(node.id, field);
                          const autoDetected = isSensitiveBlock?.sensitiveFields.includes(field);
                          return (
                            <label key={field} className="field-check">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleField(node.id, label, field, allFields)}
                                style={{ accentColor:"#4F46E5", width:14, height:14 }}
                              />
                              <span style={{ fontSize:".8rem", color: checked?"#4F46E5":"#374151", fontWeight: checked?600:400 }}>
                                {field}
                              </span>
                              {autoDetected && (
                                <span style={{ fontSize:".65rem", background:"#FEF3C7", color:"#D97706", padding:".1rem .4rem", borderRadius:4, fontWeight:700 }}>
                                  sensible
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ================================================================
              COLONNE DROITE — Métadonnées + soumettre
          ================================================================ */}
          <div className="pub-col" style={{ flex:"1 1 380px", minWidth:"300px" }}>
            <div className="glass-card" style={{ borderRadius:16, padding:"1.5rem" }}>
              <h2 style={{ fontSize:"1rem", fontWeight:800, marginBottom:"1.25rem" }}>
                3. Informations du template
              </h2>

              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                {/* Nom */}
                <div>
                  <label style={{ fontSize:".8rem", fontWeight:700, color:"#374151", display:"block", marginBottom:".35rem" }}>
                    Nom du template <span style={{ color:"#EF4444" }}>*</span>
                  </label>
                  <input
                    className="pub-input"
                    maxLength={80}
                    placeholder="Ex : Envoyer un email quand un paiement Stripe arrive"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                  <div style={{ textAlign:"right", fontSize:".7rem", color:"#9CA3AF", marginTop:".2rem" }}>{name.length}/80</div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize:".8rem", fontWeight:700, color:"#374151", display:"block", marginBottom:".35rem" }}>
                    Description <span style={{ color:"#EF4444" }}>*</span>
                  </label>
                  <textarea
                    className="pub-input"
                    rows={4}
                    maxLength={500}
                    placeholder="Decrivez ce que fait ce workflow, dans quels cas l'utiliser..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                  <div style={{ textAlign:"right", fontSize:".7rem", color:"#9CA3AF", marginTop:".2rem" }}>{description.length}/500</div>
                </div>

                {/* Catégorie */}
                <div>
                  <label style={{ fontSize:".8rem", fontWeight:700, color:"#374151", display:"block", marginBottom:".35rem" }}>Categorie</label>
                  <select
                    className="pub-input"
                    value={category}
                    onChange={e => setCategory(e.target.value as never)}
                  >
                    {TEMPLATE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Temps de config */}
                <div>
                  <label style={{ fontSize:".8rem", fontWeight:700, color:"#374151", display:"block", marginBottom:".35rem" }}>
                    Temps de configuration estime : <strong style={{ color:"#4F46E5" }}>{configTime} min</strong>
                  </label>
                  <input
                    type="range"
                    min={1} max={60} step={1}
                    value={configTime}
                    onChange={e => setConfigTime(parseInt(e.target.value))}
                    style={{ width:"100%", accentColor:"#4F46E5" }}
                  />
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:".7rem", color:"#9CA3AF" }}>
                    <span>1 min</span><span>60 min</span>
                  </div>
                </div>

                {/* Mots-clés */}
                <div>
                  <label style={{ fontSize:".8rem", fontWeight:700, color:"#374151", display:"block", marginBottom:".35rem" }}>
                    Mots-cles <span style={{ color:"#9CA3AF", fontWeight:400 }}>({keywords.length}/10)</span>
                  </label>
                  <div style={{ display:"flex", gap:".5rem", marginBottom:".5rem" }}>
                    <input
                      className="pub-input"
                      style={{ flex:1 }}
                      placeholder="email, stripe, notification..."
                      value={kwInput}
                      onChange={e => setKwInput(e.target.value)}
                      onKeyDown={e => { if (e.key==="Enter"||e.key===",") { e.preventDefault(); addKeyword(); } }}
                      maxLength={30}
                      disabled={keywords.length >= 10}
                    />
                    <button
                      onClick={addKeyword}
                      disabled={!kwInput.trim() || keywords.length >= 10}
                      style={{ padding:".6rem .9rem", background:"#4F46E5", color:"#fff", border:"none", borderRadius:10, cursor:"pointer", fontSize:".875rem", fontFamily:"inherit", fontWeight:700, opacity:(!kwInput.trim()||keywords.length>=10)?.5:1 }}
                    >
                      +
                    </button>
                  </div>
                  {keywords.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:".4rem" }}>
                      {keywords.map(kw => (
                        <span key={kw} className="kw-chip">
                          {kw}
                          <button onClick={() => removeKeyword(kw)} style={{ background:"none", border:"none", cursor:"pointer", color:"#4F46E5", padding:0, fontSize:".8rem", fontWeight:700, lineHeight:1 }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Récap données supprimées */}
                {selectedWf && configurableBlocks.length > 0 && (
                  <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:".85rem 1rem" }}>
                    <p style={{ fontSize:".78rem", fontWeight:700, color:"#D97706", marginBottom:".4rem" }}>
                      Champs vides avant publication :
                    </p>
                    {configurableBlocks.map(b => (
                      <p key={b.nodeId} style={{ fontSize:".75rem", color:"#92400E" }}>
                        <strong>{b.label}</strong> : {b.fields.join(", ")}
                      </p>
                    ))}
                  </div>
                )}

                {/* Erreur */}
                {error && (
                  <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:".75rem 1rem", fontSize:".82rem", color:"#DC2626", fontWeight:600 }}>
                    {error}
                  </div>
                )}

                {/* Soumettre */}
                <button
                  className="submit-btn"
                  disabled={!selectedWf || !name.trim() || !description.trim() || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? "Publication..." : "Publier le template"}
                </button>

                <p style={{ fontSize:".73rem", color:"#9CA3AF", textAlign:"center", lineHeight:1.5 }}>
                  En publiant, vous acceptez que votre workflow soit partage publiquement.
                  Les donnees sensibles cochees seront effacees.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
