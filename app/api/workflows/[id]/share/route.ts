import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import crypto from "crypto";

// POST /api/workflows/[id]/share → génère ou révoque un lien de partage
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const { action } = await req.json() as { action: "enable" | "disable" };

  const user = await pool.query("SELECT id FROM users WHERE email = $1", [session.user?.email]);
  if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  if (action === "enable") {
    const token = crypto.randomBytes(20).toString("hex");
    await pool.query(
      "UPDATE workflows SET share_token = $1 WHERE id = $2 AND user_id = $3",
      [token, id, user.rows[0].id]
    );
    return NextResponse.json({ share_token: token });
  }

  if (action === "disable") {
    await pool.query(
      "UPDATE workflows SET share_token = NULL WHERE id = $1 AND user_id = $2",
      [id, user.rows[0].id]
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action invalide." }, { status: 400 });
}
