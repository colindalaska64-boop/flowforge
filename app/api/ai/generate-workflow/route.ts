import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

    const user = await pool.query("SELECT plan FROM users WHERE email = $1", [session.user?.email]);
    const plan = user.rows[0]?.plan || "free";
    if (plan === "free") {
      return NextResponse.json(
        { error: "L'IA est réservée aux plans Starter et Pro." },
        { status: 403 }
      );
    }

    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt manquant." }, { status: 400 });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Tu es un assistant expert en automatisation de workflows. 
Tu analyses la description de l'utilisateur et tu génères un workflow complet avec la configuration précise de chaque nœud.

Tu retournes UNIQUEMENT du JSON valide sans markdown avec cette structure exacte :
{
  "nodes": [
    {
      "type": "gmail|webhook|schedule|sheets|slack|notion|http|ai_filter|ai_generate",
      "label": "Gmail|Webhook|Planifié|Google Sheets|Slack|Notion|HTTP Request|Filtre IA|Générer texte",
      "desc": "description courte de ce que fait ce nœud dans ce workflow",
      "config": {
        // Pour Gmail: "to", "subject", "body", "format"
        // Pour Webhook: "description", "expected_field"
        // Pour Planifié: "schedule" (JSON stringifié avec type/hour/minute/timezone)
        // Pour Google Sheets: "spreadsheet_url", "sheet_name", "action", "columns"
        // Pour Slack: "webhook_url", "channel", "message", "username"
        // Pour Notion: "database_id", "title", "content"
        // Pour HTTP Request: "url", "method", "auth_type", "body"
        // Pour Filtre IA: "condition", "action_if_yes", "action_if_no", "context"
        // Pour Générer texte: "prompt", "tone", "language", "max_words", "output_var"
      }
    }
  ]
}

RÈGLES IMPORTANTES :
- Remplis la config de chaque nœud avec les informations mentionnées par l'utilisateur
- Si l'utilisateur mentionne une adresse email → mets-la dans "to" du nœud Gmail
- Si l'utilisateur mentionne un canal Slack → mets-le dans "channel"
- Si l'utilisateur mentionne une heure → configure le planificateur
- Utilise {{variable}} pour les données dynamiques (ex: {{message}}, {{email}}, {{date}})
- Si une info n'est pas mentionnée, laisse le champ vide ""
- Génère entre 2 et 5 nœuds maximum
- RETOURNE UNIQUEMENT LE JSON`,
        },
        {
          role: "user",
          content: `Génère un workflow pour : ${prompt}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content || "";
    const clean = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de la génération." }, { status: 500 });
  }
}