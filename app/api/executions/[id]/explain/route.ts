import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    // Récupérer l'exécution (en vérifiant que l'user en est le propriétaire)
    const execRes = await pool.query(
      `SELECT e.id, e.status, e.results, e.trigger_data, w.name as workflow_name
       FROM executions e
       JOIN workflows w ON w.id = e.workflow_id
       JOIN users u ON u.id = w.user_id
       WHERE e.id = $1 AND u.email = $2`,
      [id, session.user.email]
    );

    if (execRes.rows.length === 0) {
      return NextResponse.json({ error: "Exécution introuvable." }, { status: 404 });
    }

    const exec = execRes.rows[0];

    // Extraire les erreurs
    const results = exec.results as { node: string; status: string; error?: string }[] | null;
    const errors = results?.filter(r => r.status === "error") || [];

    if (errors.length === 0) {
      return NextResponse.json({ explanation: "Ce workflow s'est exécuté avec succès, aucune erreur à expliquer." });
    }

    // Construire le contexte pour Groq
    const errorDetails = errors.map(e =>
      `- Bloc "${e.node}" : ${e.error || "erreur inconnue"}`
    ).join("\n");

    const prompt = `Tu es un assistant no-code francophone. Un workflow Loopflo a rencontré des erreurs lors de son exécution.

Workflow : "${exec.workflow_name}"
Erreurs :
${errorDetails}

Explique en 2-3 phrases simples, en français, ce qui s'est passé et comment corriger le problème.
Utilise un langage accessible à un non-développeur. Ne répète pas le nom technique des erreurs.`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.4,
    });

    const explanation = completion.choices[0]?.message?.content?.trim() || "Impossible de générer une explication.";

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("EXPLAIN ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
