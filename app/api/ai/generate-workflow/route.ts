import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

    // Vérifier le plan
    const user = await pool.query("SELECT plan FROM users WHERE email = $1", [session.user?.email]);
    const plan = user.rows[0]?.plan || "free";

    if (plan === "free") {
      return NextResponse.json(
        { error: "L'IA est réservée aux plans Starter et Pro. Upgradez votre compte !" },
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
          content: `Tu es un assistant qui génère des workflows d'automatisation. 
Tu retournes UNIQUEMENT du JSON valide, sans markdown, sans explication.
Structure exacte :
{
  "nodes": [
    { "type": "string", "label": "string", "desc": "string" }
  ]
}
Types disponibles : gmail, webhook, schedule, sheets, slack, notion, http, ai_filter, ai_generate`,
        },
        {
          role: "user",
          content: `Génère un workflow pour : ${prompt}. Entre 2 et 5 nœuds. JSON uniquement.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
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