"use client";
import { useState, useRef } from "react";
import { ChevronDown, Braces } from "lucide-react";

// Variables de sortie des blocs d'action
const blockOutputVars: { name: string; desc: string; example: string; bloc: string }[] = [
  { name: "texte_genere",  desc: "Texte généré par l'IA",          example: "Bonjour Jean, voici votre rapport...", bloc: "Générer texte" },
  { name: "ia_result",     desc: "Réponse du Filtre IA (OUI/NON)", example: "OUI",                                 bloc: "Filtre IA" },
  { name: "ia_passed",     desc: "Filtre IA passé (true/false)",   example: "true",                                bloc: "Filtre IA" },
  { name: "http_status",   desc: "Code HTTP de la réponse",        example: "200",                                 bloc: "HTTP Request" },
  { name: "stripe_id",     desc: "ID Stripe de l'objet",           example: "pi_3NxY...",                          bloc: "Stripe" },
  { name: "stripe_status", desc: "Statut du paiement Stripe",      example: "succeeded",                           bloc: "Stripe" },
  { name: "airtable_id",   desc: "ID du record Airtable créé",     example: "recXXXXXX",                           bloc: "Airtable" },
  { name: "_index",        desc: "Index de l'itération (Boucle)",  example: "0",                                   bloc: "Boucle" },
];

// Variables disponibles par type de déclencheur
const variablesByTrigger: Record<string, { name: string; desc: string; example: string }[]> = {
  webhook: [
    { name: "email",     desc: "Adresse email",      example: "client@exemple.com" },
    { name: "message",   desc: "Corps du message",    example: "Bonjour, j'ai besoin d'aide..." },
    { name: "source",    desc: "Source de l'appel",   example: "stripe" },
    { name: "date",      desc: "Date de réception",   example: "2024-01-15" },
    { name: "timestamp", desc: "Horodatage UNIX",     example: "1705312200" },
    { name: "name",      desc: "Nom du contact",      example: "Jean Dupont" },
    { name: "phone",     desc: "Numéro de téléphone", example: "+33 6 12 34 56 78" },
    { name: "amount",    desc: "Montant (paiement)",  example: "49.99" },
    { name: "currency",  desc: "Devise",              example: "EUR" },
  ],
  gmail: [
    { name: "sender",    desc: "Expéditeur",          example: "client@gmail.com" },
    { name: "subject",   desc: "Sujet de l'email",    example: "Demande d'informations" },
    { name: "body",      desc: "Corps de l'email",    example: "Bonjour, je voudrais..." },
    { name: "date",      desc: "Date de réception",   example: "2024-01-15" },
    { name: "thread_id", desc: "ID du fil de discussion", example: "18d9e3f..." },
  ],
  schedule: [
    { name: "date",       desc: "Date d'exécution",    example: "2024-01-15" },
    { name: "time",       desc: "Heure d'exécution",   example: "09:00" },
    { name: "timestamp",  desc: "Horodatage UNIX",     example: "1705312200" },
    { name: "day",        desc: "Jour de la semaine",  example: "lundi" },
    { name: "week",       desc: "Numéro de semaine",   example: "3" },
  ],
  default: [
    { name: "email",     desc: "Adresse email",      example: "client@exemple.com" },
    { name: "message",   desc: "Contenu principal",  example: "..." },
    { name: "source",    desc: "Source",             example: "webhook" },
    { name: "date",      desc: "Date",               example: "2024-01-15" },
  ],
};

export interface TextFieldWithVarsProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  triggerType?: string;
  help?: string;
}

export function TextFieldWithVars({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 4,
  triggerType = "default",
  help,
}: TextFieldWithVarsProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const vars = variablesByTrigger[triggerType] ?? variablesByTrigger.default;
  const filtered = vars.filter(
    (v) => v.name.includes(search.toLowerCase()) || v.desc.toLowerCase().includes(search.toLowerCase())
  );
  const filteredOutputs = blockOutputVars.filter(
    (v) => v.name.includes(search.toLowerCase()) || v.desc.toLowerCase().includes(search.toLowerCase()) || v.bloc.toLowerCase().includes(search.toLowerCase())
  );

  function insertVar(varName: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + `{{${varName}}}`);
      setOpen(false);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const token = `{{${varName}}}`;
    const newVal = before + token + after;
    onChange(newVal);
    setOpen(false);
    setSearch("");
    // Replace cursor after inserted token
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + token.length;
      textarea.setSelectionRange(pos, pos);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".3rem", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ fontSize: ".78rem", fontWeight: 600, color: "#374151" }}>{label}</label>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => { setOpen((o) => !o); setSearch(""); }}
            style={{
              display: "flex", alignItems: "center", gap: ".3rem",
              fontSize: ".72rem", fontWeight: 700,
              color: open ? "#fff" : "#4F46E5",
              background: open ? "#4F46E5" : "#EEF2FF",
              border: `1px solid ${open ? "#4F46E5" : "#C7D2FE"}`,
              padding: ".25rem .6rem", borderRadius: 6, cursor: "pointer",
              fontFamily: "inherit", transition: "all .15s",
            }}
          >
            <Braces size={11} strokeWidth={2.5} />
            Variables
            <ChevronDown size={10} strokeWidth={2.5} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
          </button>

          {/* Dropdown */}
          {open && (
            <>
              {/* Backdrop */}
              <div style={{ position: "fixed", inset: 0, zIndex: 149 }} onClick={() => setOpen(false)} />
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 150,
                background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)", width: 280,
                overflow: "hidden",
              }}>
                {/* Search */}
                <div style={{ padding: ".5rem .6rem", borderBottom: "1px solid #F3F4F6" }}>
                  <input
                    type="text"
                    placeholder="Rechercher une variable..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                    style={{ width: "100%", padding: ".45rem .65rem", border: "1px solid #E5E7EB", borderRadius: 7, fontSize: ".78rem", fontFamily: "inherit", outline: "none", background: "#FAFAFA" }}
                  />
                </div>

                {/* Variable list */}
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {/* Section Trigger */}
                  {filtered.length > 0 && (
                    <>
                      <div style={{ padding: ".3rem .75rem", background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                        <span style={{ fontSize: ".65rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".06em" }}>
                          Déclencheur — {triggerType}
                        </span>
                      </div>
                      {filtered.map((v) => (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => insertVar(v.name)}
                          style={{ width: "100%", textAlign: "left", padding: ".5rem .75rem", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "flex-start", gap: ".6rem", borderBottom: "1px solid #F9FAFB", transition: "background .1s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F3FF")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        >
                          <code style={{ background: "#EEF2FF", color: "#4F46E5", fontSize: ".72rem", fontWeight: 700, padding: ".15rem .4rem", borderRadius: 4, flexShrink: 0, border: "1px solid #C7D2FE", whiteSpace: "nowrap" }}>{`{{${v.name}}}`}</code>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: ".75rem", fontWeight: 600, color: "#374151" }}>{v.desc}</p>
                            <p style={{ fontSize: ".68rem", color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>ex: {v.example}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {/* Section Blocs */}
                  {filteredOutputs.length > 0 && (
                    <>
                      <div style={{ padding: ".3rem .75rem", background: "#FAFAFA", borderBottom: "1px solid #F3F4F6", borderTop: filtered.length > 0 ? "1px solid #E5E7EB" : undefined }}>
                        <span style={{ fontSize: ".65rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".06em" }}>
                          Sorties des blocs
                        </span>
                      </div>
                      {filteredOutputs.map((v) => (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => insertVar(v.name)}
                          style={{ width: "100%", textAlign: "left", padding: ".5rem .75rem", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "flex-start", gap: ".6rem", borderBottom: "1px solid #F9FAFB", transition: "background .1s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF7ED")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        >
                          <code style={{ background: "#FFF7ED", color: "#D97706", fontSize: ".72rem", fontWeight: 700, padding: ".15rem .4rem", borderRadius: 4, flexShrink: 0, border: "1px solid #FDE68A", whiteSpace: "nowrap" }}>{`{{${v.name}}}`}</code>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: ".75rem", fontWeight: 600, color: "#374151" }}>{v.desc}</p>
                            <p style={{ fontSize: ".68rem", color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.bloc} · ex: {v.example}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {filtered.length === 0 && filteredOutputs.length === 0 && (
                    <p style={{ fontSize: ".78rem", color: "#9CA3AF", textAlign: "center", padding: "1rem" }}>Aucun résultat</p>
                  )}
                </div>

                <div style={{ padding: ".4rem .75rem", background: "#FAFAFA", borderTop: "1px solid #F3F4F6" }}>
                  <p style={{ fontSize: ".68rem", color: "#9CA3AF" }}>Cliquez sur une variable pour l&apos;insérer à la position du curseur</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: ".65rem .75rem",
          border: "1px solid #E5E7EB", borderRadius: 8,
          fontSize: ".82rem", fontFamily: "inherit",
          outline: "none", background: "#FAFAFA",
          resize: "vertical", lineHeight: 1.6, color: "#0A0A0A",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#818CF8";
          e.currentTarget.style.boxShadow = "0 0 0 3px #EEF2FF";
          e.currentTarget.style.background = "#fff";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "#E5E7EB";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.background = "#FAFAFA";
        }}
      />

      {help && <p style={{ fontSize: ".7rem", color: "#9CA3AF" }}>{help}</p>}
    </div>
  );
}