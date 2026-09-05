"use client";

import { useCallback, useEffect, useState } from "react";

type Membre = {
  id: number;
  email: string;
  name: string | null;
  role: "lecture" | "admin" | "owner";
  added_by: string | null;
  added_at: string | null;
  proprietaire: boolean;
};

const ROLE_INFO = {
  owner: { titre: "Propriétaire", badge: "badge-ok" },
  admin: { titre: "Administrateur", badge: "badge-accent" },
  lecture: { titre: "Lecture seule", badge: "badge-neutral" },
} as const;

export default function TeamManager() {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [chargement, setChargement] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"lecture" | "admin">("lecture");
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const res = await fetch("/api/admin/team");
      if (res.ok) setMembres((await res.json()).membres || []);
      else setErreur("Impossible de charger l'équipe.");
    } catch {
      setErreur("Erreur réseau.");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setOccupe(true);
    setErreur("");
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErreur(data.error || "L'opération a échoué."); return; }
      setEmail("");
      await charger();
    } finally {
      setOccupe(false);
    }
  }

  async function revoquer(cible: string) {
    if (!confirm(`Retirer tous les droits d'administration de ${cible} ?`)) return;
    setOccupe(true);
    setErreur("");
    try {
      const res = await fetch("/api/admin/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cible }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErreur(data.error || "L'opération a échoué."); return; }
      await charger();
    } finally {
      setOccupe(false);
    }
  }

  return (
    <>
      <div className="card mb">
        <div className="card-head"><p className="card-title">Donner un accès</p></div>
        <div className="card-body">
          <p className="note note-warn mb">
            La personne doit déjà avoir un compte Loopflo avec cette adresse. On n&apos;invite
            pas une adresse inconnue depuis le panel.
          </p>

          <form onSubmit={ajouter} className="toolbar" style={{ marginBottom: 0 }}>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="field"
              placeholder="adresse@exemple.fr"
              style={{ flex: 1, minWidth: 220 }}
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value as "lecture" | "admin")}
              className="field"
            >
              <option value="lecture">Lecture seule</option>
              <option value="admin">Administrateur</option>
            </select>
            <button type="submit" disabled={occupe} className="btn btn-primary">
              Donner l&apos;accès
            </button>
          </form>

          {erreur && <p className="note note-err" style={{ marginTop: "1rem" }}>{erreur}</p>}
        </div>
      </div>

      <div className="card mb">
        <div className="card-head">
          <p className="card-title">Membres</p>
          <span className="badge badge-neutral">{membres.length}</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Personne</th>
                <th>Rôle</th>
                <th>Ajouté par</th>
                <th>Depuis</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {chargement ? (
                <tr><td colSpan={5}><div className="empty"><p className="empty-title">Chargement…</p></div></td></tr>
              ) : membres.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                      <span className="avatar">{(m.name || m.email).charAt(0).toUpperCase()}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: "var(--a-text)" }}>{m.name || "Sans nom"}</p>
                        <p style={{ fontSize: ".72rem", color: "var(--a-text-3)" }}>{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${ROLE_INFO[m.role].badge}`}>{ROLE_INFO[m.role].titre}</span></td>
                  <td>{m.proprietaire ? "—" : (m.added_by || "—")}</td>
                  <td>{m.added_at ? new Date(m.added_at).toLocaleDateString("fr-FR") : "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    {m.proprietaire ? (
                      <span style={{ fontSize: ".72rem", color: "var(--a-text-3)" }}>Non modifiable</span>
                    ) : (
                      <button onClick={() => revoquer(m.email)} disabled={occupe} className="btn btn-sm btn-danger">
                        Retirer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><p className="card-title">Ce que chaque rôle permet</p></div>
        <div className="card-body">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Action</th><th>Lecture</th><th>Admin</th><th>Propriétaire</th></tr>
              </thead>
              <tbody>
                {[
                  ["Consulter utilisateurs, exécutions, signalements", true, true, true],
                  ["Bannir ou débannir un compte", false, true, true],
                  ["Changer le plan d'un utilisateur", false, true, true],
                  ["Modérer les templates", false, true, true],
                  ["Supprimer définitivement un compte", false, false, true],
                  ["Couper le site (maintenance)", false, false, true],
                  ["Désactiver une intégration", false, false, true],
                  ["Envoyer un email à tous les utilisateurs", false, false, true],
                  ["Gérer cette équipe", false, false, true],
                ].map(([label, l, a, o]) => (
                  <tr key={label as string}>
                    <td className="strong">{label as string}</td>
                    {[l, a, o].map((ok, i) => (
                      <td key={i} style={{ textAlign: "center", color: ok ? "var(--a-ok)" : "var(--a-text-3)", fontWeight: 700 }}>
                        {ok ? "Oui" : "Non"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
