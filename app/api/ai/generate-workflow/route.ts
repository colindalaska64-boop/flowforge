import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Tu es l'IA de Loopflo, expert automation no-code. Pose max 2 questions courtes (une à la fois), en français. Dès que tu as assez d'infos, génère le JSON.

BLOCS (type → config clés) :
Triggers: webhook(description,expected_field) | schedule(schedule,timezone) | slack_event(description) | github(event_type)
Actions: gmail(to,subject,body,format) | slack(webhook_url,channel,message) | discord(webhook_url,message) | sheets(spreadsheet_url,sheet_name,columns,action) | notion(database_id,title,content) | http(url,method,body,auth_type) | telegram(bot_token,chat_id,message) | sms(to_number,from_number,message,account_sid,auth_token) | hubspot(api_key,email,first_name,last_name) | airtable(api_key,base_id,table_name,fields) | stripe(secret_key,action,resource_id)
IA: ai_filter(condition,action_if_yes,action_if_no) | ai_generate(prompt,tone,max_words,output_var)
Logique: condition(field,operator,value) | loop(array_field)

LABELS exacts (utilise-les dans "label") :
webhook→Webhook | schedule→Planifié | gmail→Gmail | sheets→Google Sheets | http→HTTP Request | ai_filter→Filtre IA | ai_generate→Générer texte | slack_event→Slack Event | github→GitHub | discord→Discord | airtable→Airtable | stripe→Stripe | telegram→Telegram | sms→SMS | hubspot→HubSpot | condition→Condition | loop→Boucle | slack→Slack | notion→Notion

VARIABLES — insère {{variable}} dans les configs texte (to, body, message, subject, etc.) :
Après webhook/http : {{email}} {{name}} {{message}} {{phone}} {{amount}} {{subject}} {{status}} {{id}}
Après schedule : {{date}} {{time}} {{day}} {{timestamp}}
Après github : {{repo}} {{branch}} {{commit}} {{author}}
Après slack_event : {{text}} {{user}} {{channel}}
Après ai_generate : {{texte_genere}}

FORMAT schedule JSON : {"type":"daily","hour":"9","minute":"0"} | {"type":"weekly","days":["monday","friday"],"hour":"9","minute":"0"} | {"type":"hourly","intervalHours":"2"} | {"type":"monthly","dayOfMonth":"1","hour":"9","minute":"0"}
FORMAT columns Sheets : [{"col":"A","val":"{{email}}"},{"col":"B","val":"{{name}}"}]
FORMAT gmail format : "HTML" ou "Texte brut"

QUAND PRÊT — réponds UNIQUEMENT avec ce JSON (rien avant, rien après) :
{"ready":true,"name":"Nom court du workflow","nodes":[{"type":"webhook","label":"Webhook","desc":"description courte","config":{"description":"Paiement reçu"}}],"edges":[{"from":0,"to":1},{"from":1,"to":2}]}

Pour Condition ou Filtre IA : branches avec {"from":1,"to":2,"handle":"yes"},{"from":1,"to":3,"handle":"no"}

SINON : {"ready":false,"question":"question courte","hint":"exemple de réponse"}`;

export async function POST(req: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
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
      temperature: 0.2,
      max_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
    });

    const content = completion.choices[0]?.message?.content || "";

    // Extract last JSON object (most complete one)
    const matches = [...content.matchAll(/\{[\s\S]*?\}/g)];
    // Find the outermost JSON block
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      } catch {
        // Try to find valid JSON by scanning
        for (let i = content.length - 1; i >= 0; i--) {
          if (content[i] === "}") {
            const start = content.lastIndexOf("{", i);
            if (start !== -1) {
              try {
                const parsed = JSON.parse(content.slice(start, i + 1));
                return NextResponse.json(parsed);
              } catch { continue; }
            }
          }
        }
      }
    }

    // Fallback
    return NextResponse.json({ ready: false, question: content.slice(0, 300), hint: "" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de la génération." }, { status: 500 });
  }
}
