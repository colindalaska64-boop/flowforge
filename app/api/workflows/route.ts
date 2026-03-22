import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

    const { name, data, id } = await req.json();
    const user = await pool.query("SELECT id, plan FROM users WHERE email = $1", [session.user?.email]);
    if (user.rows.length === 0) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

    const userPlan = user.rows[0].plan || "free";
    const userId = user.rows[0].id;

    if (!id && userPlan === "free") {
      const count = await pool.query("SELECT COUNT(*) FROM workflows WHERE user_id = $1", [userId]);
      if (parseInt(count.rows[0].count) >= 5) {
        return NextResponse.json({
          error: "Limite atteinte ! Le plan Free est limité à 5 workflows. Passez en Starter pour des workflows illimités."
        }, { status: 403 });
      }
    }

    if (id) {
      await pool.query(
        "UPDATE workflows SET name = $1, data = $2 WHERE id = $3 AND user_id = $4",
        [name, JSON.stringify(data), id, userId]
      );
      return NextResponse.json({ id, message: "Workflow mis à jour !" }, { status: 200 });
    }

    const result = await pool.query(
      "INSERT INTO workflows (user_id, name, data) VALUES ($1, $2, $3) RETURNING id",
      [userId, name, JSON.stringify(data)]
    );
    return NextResponse.json({ id: result.rows[0].id, message: "Workflow sauvegardé !" }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

    const user = await pool.query("SELECT id FROM users WHERE email = $1", [session.user?.email]);
    if (user.rows.length === 0) return NextResponse.json([], { status: 200 });

    const workflows = await pool.query(
      "SELECT id, name, active, created_at FROM workflows WHERE user_id = $1 ORDER BY created_at DESC",
      [user.rows[0].id]
    );

    return NextResponse.json(workflows.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}