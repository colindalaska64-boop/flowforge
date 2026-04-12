import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import { sendBugReportToAdmin } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    const user = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [session.user?.email]
    );
    if (user.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const wf = await pool.query(
      "SELECT name FROM workflows WHERE id = $1 AND user_id = $2",
      [id, user.rows[0].id]
    );
    if (wf.rows.length === 0) {
      return NextResponse.json({ error: "Workflow introuvable." }, { status: 404 });
    }

    const body = await req.json() as {
      testData?: unknown;
      results?: unknown;
      description?: string;
    };

    // Envoyer le rapport par email à Colin
    await sendBugReportToAdmin(
      wf.rows[0].name,
      user.rows[0].email,
      body.testData ?? {},
      body.results ?? [],
      body.description
    );

    // Logger en base (CREATE IF NOT EXISTS pour migration transparente)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bug_reports (
          id SERIAL PRIMARY KEY,
          workflow_id INT,
          user_email TEXT,
          workflow_name TEXT,
          test_data JSONB,
          results JSONB,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await pool.query(
        `INSERT INTO bug_reports (workflow_id, user_email, workflow_name, test_data, results, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          user.rows[0].email,
          wf.rows[0].name,
          JSON.stringify(body.testData ?? {}),
          JSON.stringify(body.results ?? []),
          body.description || "",
        ]
      );
    } catch { /* silencieux si création table échoue */ }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("BUG REPORT ERROR:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi du rapport." }, { status: 500 });
  }
}
