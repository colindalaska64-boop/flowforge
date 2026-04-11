import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    const user = await pool.query("SELECT id, plan FROM users WHERE email = $1", [session.user?.email]);
    if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

    const userId = user.rows[0].id;
    const userPlan = user.rows[0].plan || "free";

    // Vérifier limite plan Free
    if (userPlan === "free") {
      const count = await pool.query("SELECT COUNT(*) FROM workflows WHERE user_id = $1", [userId]);
      if (parseInt(count.rows[0].count) >= 5) {
        return NextResponse.json(
          { error: "Limite atteinte. Le plan Free est limité à 5 workflows. Passez en Starter pour des workflows illimités." },
          { status: 403 }
        );
      }
    }

    // Récupérer le workflow source
    const source = await pool.query(
      "SELECT name, data FROM workflows WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (source.rows.length === 0) return NextResponse.json({ error: "Workflow introuvable." }, { status: 404 });

    const { name, data } = source.rows[0];

    // Créer la copie (inactive, sans webhook_secret)
    const result = await pool.query(
      "INSERT INTO workflows (user_id, name, data, active) VALUES ($1, $2, $3, false) RETURNING id",
      [userId, `${name} (copie)`, JSON.stringify(data)]
    );

    return NextResponse.json({ id: result.rows[0].id, message: "Workflow dupliqué !" }, { status: 201 });
  } catch (error) {
    console.error("DUPLICATE ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
