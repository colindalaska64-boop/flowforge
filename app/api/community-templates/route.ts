import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

// Créer la table si elle n'existe pas
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_templates (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      user_email TEXT NOT NULL,
      user_name TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Autre',
      tools TEXT[] NOT NULL DEFAULT '{}',
      nodes JSONB NOT NULL DEFAULT '[]',
      edges JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

// GET — liste tous les templates communautaires
export async function GET() {
  try {
    await ensureTable();
    const result = await pool.query(
      `SELECT id, user_name, name, description, category, tools, created_at
       FROM community_templates
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// POST — créer un template communautaire
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    await ensureTable();
    const userEmail = session.user?.email || "";
    const userName = session.user?.name || "Utilisateur";

    // Récupérer l'ID utilisateur
    const userRow = await pool.query("SELECT id FROM users WHERE email = $1", [userEmail]);
    if (!userRow.rows.length) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    const userId = userRow.rows[0].id;

    // Vérifier la limite de 10 templates par utilisateur
    const countRow = await pool.query(
      "SELECT COUNT(*) FROM community_templates WHERE user_id = $1",
      [userId]
    );
    if (parseInt(countRow.rows[0].count) >= 10) {
      return NextResponse.json(
        { error: "Vous avez atteint la limite de 10 templates publiés. Supprimez-en un pour en publier un nouveau." },
        { status: 429 }
      );
    }

    const { name, description, category, tools, nodes, edges } = await req.json();

    if (!name || !description || !nodes?.length) {
      return NextResponse.json({ error: "Nom, description et blocs sont requis." }, { status: 400 });
    }
    if (name.length > 80 || description.length > 300) {
      return NextResponse.json({ error: "Nom trop long (max 80 car.) ou description trop longue (max 300 car.)." }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO community_templates (user_id, user_email, user_name, name, description, category, tools, nodes, edges)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, description, category, tools, created_at`,
      [userId, userEmail, userName, name.trim(), description.trim(), category || "Autre", tools || [], JSON.stringify(nodes), JSON.stringify(edges)]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// DELETE — supprimer un template (seul l'auteur peut)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    const { id } = await req.json();
    const userEmail = session.user?.email || "";

    const result = await pool.query(
      "DELETE FROM community_templates WHERE id = $1 AND user_email = $2 RETURNING id",
      [id, userEmail]
    );
    if (!result.rows.length) {
      return NextResponse.json({ error: "Template introuvable ou non autorisé." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
