import pool from "./db";

/**
 * Rôles d'administration, du plus faible au plus fort.
 *
 * - lecture  : consulte tout le panel, ne modifie rien.
 * - admin    : gère les utilisateurs (bannir, changer un plan) et la modération.
 * - owner    : tout, plus la gestion de l'équipe. Réservé à ADMIN_EMAIL.
 */
export type AdminRole = "lecture" | "admin" | "owner";

export const ROLES: AdminRole[] = ["lecture", "admin", "owner"];

const RANG: Record<AdminRole, number> = { lecture: 1, admin: 2, owner: 3 };

/** Vrai si `role` est au moins aussi puissant que `minimum`. */
export function auMoins(role: AdminRole, minimum: AdminRole): boolean {
  return RANG[role] >= RANG[minimum];
}

export const LIBELLES: Record<AdminRole, { titre: string; desc: string }> = {
  lecture: {
    titre: "Lecture seule",
    desc: "Consulte les utilisateurs, les exécutions et les signalements. Ne peut rien modifier.",
  },
  admin: {
    titre: "Administrateur",
    desc: "Gère les utilisateurs et la modération. Ne peut ni couper le site, ni supprimer un compte, ni gérer l'équipe.",
  },
  owner: {
    titre: "Propriétaire",
    desc: "Tous les droits, y compris la gestion de l'équipe. Rôle unique, non attribuable.",
  },
};

/** Ajoute les colonnes d'administration si elles manquent. Sans effet si déjà présentes. */
export async function ensureAdminColumns(): Promise<void> {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS admin_role TEXT,
      ADD COLUMN IF NOT EXISTS admin_added_by TEXT,
      ADD COLUMN IF NOT EXISTS admin_added_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS banned_by TEXT
  `);
}

/**
 * Rôle d'un compte, ou null s'il n'est pas administrateur.
 *
 * ADMIN_EMAIL est toujours propriétaire, quoi que dise la base : c'est le
 * filet qui empêche de se verrouiller dehors de son propre panel.
 */
export async function getAdminRole(email: string): Promise<AdminRole | null> {
  if (email && email === process.env.ADMIN_EMAIL) return "owner";

  try {
    const res = await pool.query("SELECT admin_role FROM users WHERE email = $1", [email]);
    const role = res.rows[0]?.admin_role;
    // "owner" en base est ignoré : ce rôle ne s'obtient que par ADMIN_EMAIL.
    return role === "admin" || role === "lecture" ? role : null;
  } catch {
    return null;
  }
}

export type MembreEquipe = {
  id: number;
  email: string;
  name: string | null;
  role: AdminRole;
  added_by: string | null;
  added_at: string | null;
  proprietaire: boolean;
};

/** Liste des administrateurs, propriétaire en tête. */
export async function listerEquipe(): Promise<MembreEquipe[]> {
  await ensureAdminColumns();

  const res = await pool.query(
    `SELECT id, email, name, admin_role, admin_added_by, admin_added_at
     FROM users
     WHERE admin_role IN ('admin','lecture') OR email = $1
     ORDER BY (email = $1) DESC, admin_added_at ASC NULLS FIRST`,
    [process.env.ADMIN_EMAIL || ""]
  );

  return res.rows.map((r: {
    id: number; email: string; name: string | null;
    admin_role: string | null; admin_added_by: string | null; admin_added_at: string | null;
  }) => {
    const proprietaire = r.email === process.env.ADMIN_EMAIL;
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      role: proprietaire ? "owner" : ((r.admin_role === "admin" ? "admin" : "lecture") as AdminRole),
      added_by: r.admin_added_by,
      added_at: r.admin_added_at,
      proprietaire,
    };
  });
}

export type ResultatEquipe = { ok: true } | { ok: false; erreur: string };

/**
 * Attribue un rôle à un compte existant.
 * Le rôle « owner » n'est jamais attribuable, et le propriétaire n'est jamais modifiable.
 */
export async function attribuerRole(
  email: string,
  role: AdminRole,
  parQui: string
): Promise<ResultatEquipe> {
  const cible = email.trim().toLowerCase();

  if (!cible) return { ok: false, erreur: "Adresse email manquante." };
  if (role === "owner") return { ok: false, erreur: "Le rôle propriétaire ne s'attribue pas." };
  if (cible === (process.env.ADMIN_EMAIL || "").toLowerCase()) {
    return { ok: false, erreur: "Le propriétaire ne peut pas être modifié." };
  }

  await ensureAdminColumns();

  // On n'accorde des droits qu'à un compte qui existe déjà : pas d'invitation
  // d'adresses arbitraires depuis le panel.
  const user = await pool.query("SELECT id FROM users WHERE LOWER(email) = $1", [cible]);
  if (user.rows.length === 0) {
    return { ok: false, erreur: "Aucun compte Loopflo avec cette adresse. La personne doit d'abord s'inscrire." };
  }

  await pool.query(
    `UPDATE users
     SET admin_role = $1,
         admin_added_by = COALESCE(admin_added_by, $2),
         admin_added_at = COALESCE(admin_added_at, NOW())
     WHERE LOWER(email) = $3`,
    [role, parQui, cible]
  );

  return { ok: true };
}

/** Retire tous les droits d'administration d'un compte. */
export async function revoquerAdmin(email: string): Promise<ResultatEquipe> {
  const cible = email.trim().toLowerCase();

  if (cible === (process.env.ADMIN_EMAIL || "").toLowerCase()) {
    return { ok: false, erreur: "Le propriétaire ne peut pas être retiré." };
  }

  await ensureAdminColumns();
  await pool.query(
    "UPDATE users SET admin_role = NULL, admin_added_by = NULL, admin_added_at = NULL WHERE LOWER(email) = $1",
    [cible]
  );

  return { ok: true };
}
