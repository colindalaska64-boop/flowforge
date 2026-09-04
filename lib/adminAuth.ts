import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import pool from "./db";

/**
 * Vérifie le cookie de session admin (2e facteur, posé après validation du code OTP).
 */
export async function checkAdminCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return false;

    const result = await pool.query(
      "SELECT 1 FROM admin_otp WHERE token = $1 AND code = 'SESSION' AND used = false AND expires_at > NOW()",
      [token]
    );

    return result.rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Garde d'accès pour les PAGES admin.
 * Vérifie les deux facteurs : session NextAuth = ADMIN_EMAIL, puis cookie OTP.
 * Redirige et ne rend jamais la page si l'un des deux manque.
 *
 * À appeler en première ligne de CHAQUE page sous /admin (sauf /admin/login).
 */
export async function requireAdmin(): Promise<string> {
  const session = await getServerSession();
  const email = session?.user?.email;

  if (!email || email !== process.env.ADMIN_EMAIL) redirect("/dashboard");

  const verified = await checkAdminCookie();
  if (!verified) redirect("/admin/login");

  return email;
}

/**
 * Garde d'accès pour les ROUTES API admin.
 * Retourne l'email admin, ou null si l'un des deux facteurs manque.
 * Utilisation : `const admin = await getAdminOrNull(); if (!admin) return 403;`
 */
export async function getAdminOrNull(): Promise<string | null> {
  const session = await getServerSession();
  const email = session?.user?.email;

  if (!email || email !== process.env.ADMIN_EMAIL) return null;
  if (!(await checkAdminCookie())) return null;

  return email;
}
