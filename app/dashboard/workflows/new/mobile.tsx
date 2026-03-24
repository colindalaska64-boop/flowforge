export default function MobileFallback() {
    return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem", textAlign:"center", fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#FAFAFA" }}>
        <div style={{ width:56, height:56, borderRadius:14, background:"#EEF2FF", border:"1px solid #C7D2FE", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"1.5rem" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
        </div>
        <h1 style={{ fontSize:"1.3rem", fontWeight:800, marginBottom:".75rem", letterSpacing:"-0.02em" }}>Éditeur non disponible sur mobile</h1>
        <p style={{ fontSize:".9rem", color:"#6B7280", lineHeight:1.7, maxWidth:300, marginBottom:"2rem" }}>
          L&apos;éditeur de workflows nécessite un écran plus grand. Ouvrez Loopflo sur ordinateur pour créer vos automatisations.
        </p>
        <a href="/dashboard" style={{ fontSize:".9rem", fontWeight:600, color:"#4F46E5", background:"#EEF2FF", border:"1px solid #C7D2FE", padding:".7rem 1.5rem", borderRadius:10, textDecoration:"none" }}>
          ← Retour au dashboard
        </a>
      </div>
    );
  }