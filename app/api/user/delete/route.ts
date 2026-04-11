import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * RGPD — Droit à l'oubli (article 17).
 * Supprime définitivement le compte utilisateur, ses workflows, ses
 * exécutions et ses messages support.
 *
 * Double confirmation côté client requise :
 *   - body.confirm === "SUPPRIMER"
 *   - body.password (re-validation pour les comptes credentials)
 * Les comptes OAuth Google n'ont pas de mot de passe → la confirmation
 * textuelle suffit.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { confirm, password } = await req.json().catch(() => ({}));
  if (confirm !== "SUPPRIMER") {
    return NextResponse.json(
      { error: "Confirmation manquante." },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    const userRes = await client.query(
      "SELECT id, password FROM users WHERE email = $1",
      [session.user.email]
    );
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }
    const user = userRes.rows[0];

    // Vérifier le mot de passe sauf pour les comptes OAuth Google
    if (user.password && user.password !== "google-oauth") {
      if (!password) {
        return NextResponse.json({ error: "Mot de passe requis." }, { status: 400 });
      }
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 403 });
      }
    }

    await client.query("BEGIN");
    // Supprime workflows + executions (cascade si FK, sinon manuel)
    await client.query(
      `DELETE FROM executions
       WHERE workflow_id IN (SELECT id FROM workflows WHERE user_id = $1)`,
      [user.id]
    ).catch(() => {});
    await client.query("DELETE FROM workflows WHERE user_id = $1", [user.id]);
    await client.query("DELETE FROM support_messages WHERE email = $1", [session.user.email]).catch(() => {});
    await client.query("DELETE FROM password_resets WHERE email = $1", [session.user.email]).catch(() => {});
    await client.query("DELETE FROM users WHERE id = $1", [user.id]);
    await client.query("COMMIT");

    return NextResponse.json({ ok: true, message: "Compte supprimé." });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("DELETE ACCOUNT ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  } finally {
    client.release();
  }
}
