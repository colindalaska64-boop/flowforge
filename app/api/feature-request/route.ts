import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`fr:${ip}`, 5, 60 * 60 * 1000); // 5/heure
  if (!allowed) return NextResponse.json({ error: "Trop de demandes." }, { status: 429 });

  try {
    const { feature, workflowName, workflowId } = await req.json();
    if (!feature || typeof feature !== "string" || feature.trim().length < 5) {
      return NextResponse.json({ error: "Description trop courte." }, { status: 400 });
    }

    // Crée la table si elle n'existe pas encore en prod
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feature_requests (
        id BIGSERIAL PRIMARY KEY,
        workflow_id INT,
        workflow_name TEXT,
        user_email TEXT,
        node_label TEXT,
        ai_response TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(
      `INSERT INTO feature_requests (workflow_id, workflow_name, user_email, node_label, ai_response)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        workflowId ?? null,
        workflowName ?? "Soumission manuelle",
        session.user?.email ?? "",
        "Demande manuelle",
        feature.trim().slice(0, 1000),
      ]
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
