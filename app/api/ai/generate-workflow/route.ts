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
      return NextResponse.json({ error: "L'IA est réservée aux plans Starter et Pro." }, { status: 403 });
    }

    const { messages } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Messages manquants." }, { status: 400 });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `Tu es un assistant expert en automatisation no-code pour Loopflo.
Ton rôle : comprendre ce que l'utilisateur veut automatiser, poser des questions courtes pour collecter les infos manquantes, puis générer le workflow.

RÈGLES :
- Pose maximum 3 questions, une à la fois, courtes et précises
- Quand tu as assez d'infos, génère le workflow en JSON
- Réponds TOUJOURS en français
- Sois chaleureux et direct

BLOCS DISPONIBLES : gmail, webhook, schedule, sheets, slack, notion, http, ai_filter, ai_generate

QUAND TU AS ASSEZ D'INFOS, réponds avec ce JSON exact (et RIEN d'autre avant/après) :
{
  "ready": true,
  "nodes": [
    {
      "type": "webhook",
      "label": "Webhook",
      "desc": "description courte",
      "config": { "description": "..." }
    }
  ]
}

SINON réponds avec :
{
  "ready": false,
  "question": "Ta question courte ici",
  "hint": "exemple de réponse courte"
}

Types de config par bloc :
- gmail: to, cc, subject, body, format
- webhook: description, expected_field  
- schedule: schedule (JSON), timezone
- sheets: spreadsheet_url, sheet_name, action, columns
- slack: webhook_url, channel, message, username
- notion: database_id, title, content, status
- http: url, method, auth_type, body
- ai_filter: condition, action_if_yes, action_if_no, context
- ai_generate: prompt, tone, language, max_words, output_var`,
        },
        ...messages,
      ],
    });

    const content = completion.choices[0]?.message?.content || "";
    
    // Chercher le JSON dans la réponse
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      } catch {
        // pas du JSON valide
      }
    }

    // Fallback si l'IA n'a pas répondu en JSON
    return NextResponse.json({
      ready: false,
      question: content,
      hint: "",
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de la génération." }, { status: 500 });
  }
}