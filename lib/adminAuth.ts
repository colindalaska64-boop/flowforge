import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "./db";
import { getAdminRole, auMoins, type AdminRole } from "./adminTeam";

/**
 * Vérifie le cookie de session admin (2e facteur, posé après validation du code OTP).
 */
export async function checkAdminCookie(email?: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return false;

    // Le jeton de session est lié à l'adresse qui l'a obtenu : présenter le
    // cookie d'un autre administrateur ne donne pas accès à son compte.
    const result = await pool.query(
      `SELECT 1 FROM admin_otp
       WHERE token = $1 AND code = 'SESSION' AND used = false AND expires_at > NOW()
         AND (email IS NULL OR $2::text IS NULL OR email = $2)`,
      [token, email ?? null]
    );

    return result.rows.length > 0;
  } catch {
    return false;
  }
}

export type AdminContext = { email: string; role: AdminRole };

/**
 * Identité et rôle de l'administrateur courant, ou null.
 * Exige les deux facteurs : session NextAuth ET cookie OTP.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const session = await getServerSession();
  const email = session?.user?.email;
  if (!email) return null;

  const role = await getAdminRole(email);
  if (!role) return null;

  if (!(await checkAdminCookie(email))) return null;

  return { email, role };
}

/**
 * Garde d'accès pour les PAGES admin.
 * Redirige et ne rend jamais la page si l'accès n'est pas accordé.
 *
 * `minimum` exige un rôle au moins équivalent — par exemple "owner" pour la
 * gestion de l'équipe.
 *
 * À appeler en première ligne de CHAQUE page sous /admin (sauf /admin/login).
 */
export async function requireAdmin(minimum: AdminRole = "lecture"): Promise<AdminContext> {
  const session = await getServerSession();
  const email = session?.user?.email;
  if (!email) redirect("/dashboard");

  const role = await getAdminRole(email);
  if (!role) redirect("/dashboard");

  if (!(await checkAdminCookie(email))) redirect("/admin/login");

  // Connecté et admin, mais pas assez de droits pour cette page précise.
  if (!auMoins(role, minimum)) redirect("/admin");

  return { email, role };
}

/**
 * Garde d'accès pour les ROUTES API admin.
 * Retourne le contexte, ou null si l'accès n'est pas accordé.
 * Utilisation : `const admin = await getAdminOrNull("admin"); if (!admin) return 403;`
 */
export async function getAdminOrNull(minimum: AdminRole = "lecture"): Promise<AdminContext | null> {
  const ctx = await getAdminContext();
  if (!ctx) return null;
  if (!auMoins(ctx.role, minimum)) return null;
  return ctx;
}
