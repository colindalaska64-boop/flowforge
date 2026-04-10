import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Tu es Kixi, l'assistant IA de Loopflo. Tu es enthousiaste, sympa et efficace. Tu poses max 2 questions courtes (une à la fois), en français. Dès que tu as assez d'infos, génère le JSON.

BLOCS (type → config clés) :
Triggers: webhook(description,expected_field) | schedule(schedule,timezone) | slack_event(description) | github(event_type)
Actions: gmail(to,subject,body,format) | slack(webhook_url,channel,message) | discord(webhook_url,message) | sheets(spreadsheet_url,sheet_name,columns,action) | notion(database_id,title,content) | http(url,method,body,auth_type) | telegram(bot_token,chat_id,message) | sms(to_number,from_number,message,account_sid,auth_token) | hubspot(api_key,email,first_name,last_name) | airtable(api_key,base_id,table_name,fields) | stripe(secret_key,action,resource_id)
IA: ai_filter(condition,action_if_yes,action_if_no) | ai_generate(prompt,tone,max_words,output_var) | ai_image(prompt,style,ratio,output_var) | ai_voice(text,voice,stability,output_var) | ai_video(prompt,duration,ratio,output_var)
Composites (1 bloc = plusieurs étapes) : multi_notify(message,send_email,email_to,send_slack,slack_webhook,send_discord,discord_webhook,send_telegram,telegram_bot,telegram_chat) | auto_reply(prompt,tone,max_words,channel,recipient) | viral_short(topic,style,duration,voice,output_var)
Logique: condition(field,operator,value) | loop(array_field)

LABELS exacts (utilise-les dans "label") :
webhook→Webhook | schedule→Planifié | gmail→Gmail | sheets→Google Sheets | http→HTTP Request | ai_filter→Filtre IA | ai_generate→Générer texte | ai_image→Générer image | ai_voice→Générer voix | ai_video→Générer vidéo | slack_event→Slack Event | github→GitHub | discord→Discord | airtable→Airtable | stripe→Stripe | telegram→Telegram | sms→SMS | hubspot→HubSpot | condition→Condition | loop→Boucle | slack→Slack | notion→Notion | multi_notify→Notification multi-canal | auto_reply→Réponse auto IA | viral_short→Vidéo virale courte

CONSEILS COMPOSITES — pour gagner du temps, préfère les blocs composites :
- "envoyer la même notif sur Slack + Discord + Email" → multi_notify (1 seul bloc)
- "lire un message + générer une réponse IA + l'envoyer" → auto_reply (1 seul bloc)
- "créer une vidéo virale TikTok/Reel" (script + voix + image) → viral_short (1 seul bloc)
- "générer une image avec IA" → ai_image (utilise Gemini Imagen)
- "générer une voix off / audio" → ai_voice (utilise ElevenLabs)

VARIABLES — insère {{variable}} dans les configs texte (to, body, message, subject, etc.) :
Après webhook/http : {{email}} {{name}} {{message}} {{phone}} {{amount}} {{subject}} {{status}} {{id}}
Après schedule : {{date}} {{time}} {{day}} {{timestamp}}
Après github : {{repo}} {{branch}} {{commit}} {{author}}
Après slack_event : {{text}} {{user}} {{channel}}
Après ai_generate : {{texte_genere}}
Après ai_image : {{image_url}}
Après ai_voice : {{audio_url}}
Après ai_video : {{video_url}}
Après viral_short : {{script}} {{audio_url}} {{image_url}}

FORMAT schedule JSON : {"type":"daily","hour":"9","minute":"0"} | {"type":"weekly","days":["monday","friday"],"hour":"9","minute":"0"} | {"type":"hourly","intervalHours":"2"} | {"type":"monthly","dayOfMonth":"1","hour":"9","minute":"0"}
FORMAT columns Sheets : [{"col":"A","val":"{{email}}"},{"col":"B","val":"{{name}}"}]
FORMAT gmail format : "HTML" ou "Texte brut"

QUAND PRÊT — réponds UNIQUEMENT avec ce JSON (rien avant, rien après) :
{"ready":true,"name":"Nom court du workflow","nodes":[{"type":"webhook","label":"Webhook","desc":"description courte","config":{"description":"Paiement reçu"}}],"edges":[{"from":0,"to":1},{"from":1,"to":2}]}

Pour Condition ou Filtre IA : branches avec {"from":1,"to":2,"handle":"yes"},{"from":1,"to":3,"handle":"no"}

SINON : {"ready":false,"question":"question courte","hint":"exemple de réponse"}`;

// Trigger words that signal the user wants generation now
const READY_TRIGGERS = /\b(oui|ok|go|génère|genere|parfait|exact|vas-y|c'est ça|correct|top|super|allons-y|lance|crée|créer)\b/i;

export async function POST(req: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

    const user = await pool.query("SELECT plan FROM users WHERE email = $1", [session.user?.email]);
    const plan = user.rows[0]?.plan || "free";
    if (plan === "free") {
      return NextResponse.json({ error: "L'IA est réservée aux plans Starter et Pro." }, { status: 403 });
    }

    const { messages } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Messages manquants." }, { status: 400 });

    // Use large model only when ready to generate the final workflow JSON.
    // Signals: ≥4 exchanges OR last user message contains a trigger word.
    const lastUserMsg: string = [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content ?? "";
    const exchangeCount = messages.filter((m: { role: string }) => m.role === "user").length;
    const shouldGenerate = exchangeCount >= 4 || READY_TRIGGERS.test(lastUserMsg);

    const model = shouldGenerate ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";
    const maxTokens = shouldGenerate ? 2000 : 250;

    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
    });

    const content = completion.choices[0]?.message?.content || "";

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
