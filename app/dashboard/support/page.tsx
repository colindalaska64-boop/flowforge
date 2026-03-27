"use client";
import { useState } from "react";

const faqs = [
  { q: "Comment créer mon premier workflow ?", a: "Allez dans 'Nouveau workflow', glissez un déclencheur depuis la barre latérale (ex: Webhook ou Planifié), ajoutez des actions (Gmail, Slack, etc.) et reliez-les. Cliquez sur 'Activer' pour le mettre en marche." },
  { q: "Pourquoi mon workflow ne s'exécute pas ?", a: "Vérifiez que le workflow est bien activé (bouton 'Activer'). Pour les webhooks, assurez-vous d'envoyer une requête à l'URL affichée dans l'éditeur. Pour les workflows planifiés, la vérification se fait une fois par heure." },
  { q: "Comment utiliser les variables entre blocs ?", a: "Utilisez la syntaxe {{nom_variable}} dans les champs de configuration. Cliquez sur le bouton violet '{}' à côté d'un champ pour voir toutes les variables disponibles depuis les blocs précédents." },
  { q: "Les blocs IA ne fonctionnent pas sur mon plan Free.", a: "Les blocs IA (Filtre IA, Générer texte) sont réservés au plan Pro et supérieur. Passez en Pro depuis la page Tarifs pour débloquer ces fonctionnalités." },
  { q: "Comment connecter Gmail / Slack / Notion ?", a: "Allez dans Paramètres → section Connexions. Pour Gmail, entrez votre adresse et un mot de passe d'application Google. Pour Slack, entrez l'URL de votre webhook entrant. Pour Notion, entrez votre token d'intégration." },
  { q: "Comment annuler mon abonnement ?", a: "Contactez-nous à loopflo.contact@gmail.com avec votre email. L'annulation prend effet immédiatement et vous conservez l'accès jusqu'à la fin de la période payée." },
  { q: "Mes données sont-elles sécurisées ?", a: "Oui. Toutes les données sont chiffrées en transit (TLS 1.3) et stockées en Europe. Nous sommes conformes RGPD et ne revendons aucune donnée." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(o => !o)} style={{ border:"1px solid #E5E7EB", borderRadius:10, background:"#fff", cursor:"pointer", overflow:"hidden" }}>
      <div style={{ padding:"1rem 1.25rem", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem" }}>
        <span style={{ fontSize:".9rem", fontWeight:600, color:"#0A0A0A" }}>{q}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, transform:open?"rotate(180deg)":"rotate(0deg)", transition:"transform .2s" }}>
          <path d="M3 6l5 5 5-5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {open && <div style={{ padding:"0 1.25rem 1rem", fontSize:".875rem", color:"#6B7280", lineHeight:1.7, borderTop:"1px solid #F3F4F6" }}>{a}</div>}
    </div>
  );
}

export default function SupportPage() {
  const [form, setForm] = useState({ subject: "", message: "" });
  const [sent, setSent] = useState(false);

  return (
    <div style={{ padding:"2rem", maxWidth:760, margin:"0 auto" }}>
      <h1 style={{ fontSize:"1.5rem", fontWeight:800, color:"#0A0A0A", marginBottom:".5rem" }}>Centre d&apos;aide</h1>
      <p style={{ color:"#6B7280", fontSize:".9rem", marginBottom:"2rem" }}>Trouvez des réponses ou contactez notre équipe.</p>

      <h2 style={{ fontSize:"1rem", fontWeight:700, color:"#0A0A0A", marginBottom:"1rem" }}>Questions fréquentes</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:".75rem", marginBottom:"2.5rem" }}>
        {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
      </div>

      <div style={{ background:"#F9FAFB", border:"1px solid #E5E7EB", borderRadius:12, padding:"1.5rem" }}>
        <h2 style={{ fontSize:"1rem", fontWeight:700, color:"#0A0A0A", marginBottom:".25rem" }}>Contacter le support</h2>
        <p style={{ fontSize:".85rem", color:"#6B7280", marginBottom:"1.25rem" }}>Réponse sous 24h (prioritaire pour les plans Starter, Pro et Business).</p>

        {sent ? (
          <div style={{ background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:8, padding:"1rem 1.25rem", color:"#065F46", fontSize:".875rem", fontWeight:600 }}>
            Message envoyé ! On vous répond sous 24h.
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); window.open(`mailto:loopflo.contact@gmail.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(form.message)}`); setSent(true); }}>
            <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
              <div>
                <label style={{ fontSize:".8rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".35rem" }}>Sujet</label>
                <input type="text" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Ex: Problème avec mon workflow Gmail" style={{ width:"100%", padding:".6rem .9rem", border:"1px solid #D1D5DB", borderRadius:8, fontSize:".875rem", outline:"none", background:"#fff" }} />
              </div>
              <div>
                <label style={{ fontSize:".8rem", fontWeight:600, color:"#374151", display:"block", marginBottom:".35rem" }}>Message</label>
                <textarea required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Décrivez votre problème en détail..." rows={5} style={{ width:"100%", padding:".6rem .9rem", border:"1px solid #D1D5DB", borderRadius:8, fontSize:".875rem", outline:"none", resize:"vertical", background:"#fff", fontFamily:"inherit" }} />
              </div>
              <button type="submit" style={{ alignSelf:"flex-start", background:"#4F46E5", color:"#fff", border:"none", borderRadius:8, padding:".65rem 1.5rem", fontSize:".875rem", fontWeight:600, cursor:"pointer" }}>
                Envoyer le message
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop:"1.25rem", paddingTop:"1rem", borderTop:"1px solid #E5E7EB" }}>
          <p style={{ fontSize:".8rem", color:"#9CA3AF" }}>Ou écrivez directement à <a href="mailto:loopflo.contact@gmail.com" style={{ color:"#4F46E5", textDecoration:"none", fontWeight:600 }}>loopflo.contact@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
