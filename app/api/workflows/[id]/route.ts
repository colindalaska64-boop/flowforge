import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import crypto from "crypto";

// --- GET : Récupérer un workflow spécifique ---
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const user = await pool.query("SELECT id FROM users WHERE email = $1", [session.user?.email]);
  if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  const result = await pool.query(
    "SELECT * FROM workflows WHERE id = $1 AND user_id = $2",
    [id, user.rows[0].id]
  );

  if (result.rows.length === 0) return NextResponse.json({ error: "Workflow introuvable." }, { status: 404 });

  return NextResponse.json(result.rows[0]);
}

// --- PATCH : Activer/Désactiver un workflow ---
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  let active: boolean;
  try { ({ active } = await req.json()); }
  catch { return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 }); }

  const user = await pool.query("SELECT id FROM users WHERE email = $1", [session.user?.email]);
  if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  let webhookSecret = null;

  if (active) {
    const existing = await pool.query("SELECT webhook_secret FROM workflows WHERE id = $1", [id]);
    if (!existing.rows[0]?.webhook_secret) {
      webhookSecret = crypto.randomBytes(16).toString("hex");
      await pool.query(
        "UPDATE workflows SET active = $1, webhook_secret = $2 WHERE id = $3 AND user_id = $4",
        [active, webhookSecret, id, user.rows[0].id]
      );
    } else {
      webhookSecret = existing.rows[0].webhook_secret;
      await pool.query(
        "UPDATE workflows SET active = $1 WHERE id = $2 AND user_id = $3",
        [active, id, user.rows[0].id]
      );
    }
  } else {
    await pool.query(
      "UPDATE workflows SET active = $1 WHERE id = $2 AND user_id = $3",
      [active, id, user.rows[0].id]
    );
  }

  return NextResponse.json({
    message: active ? "Workflow activé !" : "Workflow désactivé.",
    webhookUrl: webhookSecret ? `${process.env.NEXTAUTH_URL}/api/webhook/${webhookSecret}` : null,
  });
}

// --- DELETE : Supprimer un workflow et ses données liées ---
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const user = await pool.query("SELECT id FROM users WHERE email = $1", [session.user?.email]);
  if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  // Supprimer les exécutions liées d'abord pour respecter l'intégrité référentielle
  await pool.query("DELETE FROM executions WHERE workflow_id = $1", [id]);

  // Puis supprimer le workflow
  await pool.query(
    "DELETE FROM workflows WHERE id = $1 AND user_id = $2",
    [id, user.rows[0].id]
  );

  return NextResponse.json({ message: "Workflow supprimé." });
}