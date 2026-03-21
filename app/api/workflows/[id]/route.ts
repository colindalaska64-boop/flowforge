import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const { active } = await req.json();

  const user = await pool.query("SELECT id FROM users WHERE email = $1", [session.user?.email]);
  if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  await pool.query(
    "UPDATE workflows SET active = $1 WHERE id = $2 AND user_id = $3",
    [active, id, user.rows[0].id]
  );

  return NextResponse.json({ message: active ? "Workflow activé !" : "Workflow désactivé." });
}