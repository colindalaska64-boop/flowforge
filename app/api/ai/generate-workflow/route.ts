import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Tu es Kixi, l'assistant IA de Loopflo. Tu es enthousiaste, sympa et efficace. Tu poses max 2 questions courtes (une à la fois), en français. Dès que tu as assez d'infos, génère le JSON IMMÉDIATEMENT sans poser d'autres questions.

RÈGLE IMPORTANTE : Si le premier message de l'utilisateur mentionne clairement un déclencheur (webhook, schedule, gmail, slack, etc.) ET une action, génère directement sans poser de question.

BLOCS (type → config clés) :
Triggers: webhook(description,expected_field) | schedule(schedule,timezone) | slack_event(description) | github(event_type)
Actions: gmail(to,subject,body,format) | slack(webhook_url,channel,message) | discord(webhook_url,message) | sheets(spreadsheet_url,sheet_name,columns,action) | notion(database_id,title,content) | http(url,method,body,auth_type) | telegram(bot_token,chat_id,message) | sms(to_number,from_number,message,account_sid,auth_token) | hubspot(api_key,email,first_name,last_name) | airtable(api_key,base_id,table_name,fields) | stripe(secret_key,action,resource_id) | instagram(access_token,instagram_account_id,media_type,image_url,caption) | youtube(client_id,client_secret,refresh_token,title,description,video_url) | tiktok(access_token,open_id,video_url,caption) | threads(access_token,user_id,text) | pinterest(access_token,board_id,image_url,title,description) | twitch(client_id,client_secret,broadcaster_id,event_type) | reddit(client_id,client_secret,subreddit,title,content) | substack(publication_url,title,body)
IA: ai_filter(condition,action_if_yes,action_if_no) | ai_generate(prompt,tone,max_words,output_var) | elevenlabs(api_key,voice_id,text,output_var) | stability(api_key,prompt,negative_prompt,aspect_ratio,output_var) | runway(api_key,prompt,mode,duration,output_var) | heygen(api_key,avatar_id,script,aspect_ratio,output_var) | suno(api_key,prompt,mode,duration,output_var)
Logique: condition(field,operator,value) | loop(array_field)

LABELS exacts (utilise-les dans "label") :
webhook→Webhook | schedule→Planifié | gmail→Gmail | sheets→Google Sheets | http→HTTP Request | ai_filter→Filtre IA | ai_generate→Générer texte | slack_event→Slack Event | github→GitHub | discord→Discord | airtable→Airtable | stripe→Stripe | telegram→Telegram | sms→SMS | hubspot→HubSpot | condition→Condition | loop→Boucle | slack→Slack | notion→Notion | instagram→Instagram | youtube→YouTube | tiktok→TikTok | threads→Threads | pinterest→Pinterest | twitch→Twitch | reddit→Reddit | substack→Substack | elevenlabs→ElevenLabs | stability→Stability AI | runway→Runway | heygen→HeyGen | suno→Suno

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

SINON (seulement si info vraiment manquante) : {"ready":false,"question":"question courte","hint":"exemple de réponse"}`;

const GUIDE_PROMPT = `Tu es Kixi, l'assistant IA de Loopflo. En mode guide, tu aides les nouveaux utilisateurs à créer leur premier workflow MANUELLEMENT dans l'éditeur — tu n'as pas besoin de générer de JSON. Tu es pédagogue, enthousiaste et concis (max 4 phrases par réponse).

Quand l'utilisateur décrit son besoin, réponds en 3 étapes concrètes :
1. Quel bloc glisser depuis le panneau gauche (nom exact du bloc)
2. Comment relier les blocs (glisser depuis le point du bloc)
3. Quoi configurer (double-clic → panneau de droite)

Utilise des emojis pour rendre ça vivant. Si l'utilisateur veut aller plus vite, dis-lui qu'il peut upgrader pour que Kixi génère tout automatiquement.

Ne génère JAMAIS de JSON — réponds uniquement en texte.`;

const IMPROVE_SUFFIX = `\n\nMODE AMÉLIORATION : L'utilisateur veut améliorer son workflow existant ci-dessous. Analyse-le et propose une version améliorée : ajoute un filtre IA pour éviter les faux positifs, améliore les messages, ajoute une gestion d'erreur (condition), ou enrichis le workflow. Génère directement la version améliorée en JSON sauf si une précision est vraiment nécessaire.\n\nWORKFLOW ACTUEL : `;

// Words that signal immediate generation
const READY_TRIGGERS = /\b(oui|ok|go|génère|genere|parfait|exact|vas-y|c'est ça|correct|top|super|allons-y|lance|crée|créer|améliore|ameliore|optimise|oui génère|yes|yep|let'?s go)\b/i;

// Service keywords — if ≥2 are present in the first message, generate immediately
const SERVICE_KEYWORDS = /\b(webhook|gmail|slack|discord|notion|sheets|google sheets|airtable|hubspot|stripe|telegram|sms|github|http|schedule|planifié|chaque|lundi|mardi|quotidien|hebdo|mensuel|filtre|condition|boucle|loop|instagram|youtube|tiktok|threads|pinterest|twitch|reddit|substack|elevenlabs|stability|runway|heygen|suno)\b/gi;

export async function POST(req: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

    const user = await pool.query("SELECT plan FROM users WHERE email = $1", [session.user?.email]);
    const plan = user.rows[0]?.plan || "free";

    const { messages, improveMode, currentNodes, guideMode } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Messages manquants." }, { status: 400 });

    // Guide mode is free — only block workflow generation for free users
    if (plan === "free" && !guideMode) {
      return NextResponse.json({ error: "L'IA est réservée aux plans Starter et Pro." }, { status: 403 });
    }

    const lastUserMsg: string = [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content ?? "";
    const firstUserMsg: string = messages.find((m: { role: string }) => m.role === "user")?.content ?? "";
    const exchangeCount = messages.filter((m: { role: string }) => m.role === "user").length;

    // Detect if first message already has enough context to generate directly
    const serviceMatches = firstUserMsg.match(SERVICE_KEYWORDS) || [];
    const uniqueServices = new Set(serviceMatches.map(s => s.toLowerCase()));
    const richFirstMessage = uniqueServices.size >= 2;

    const shouldGenerate = exchangeCount >= 3 || READY_TRIGGERS.test(lastUserMsg) || richFirstMessage || improveMode;

    const model = shouldGenerate ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";
    const maxTokens = shouldGenerate ? 2000 : 300;

    // Build system prompt
    let systemPrompt = guideMode ? GUIDE_PROMPT : SYSTEM_PROMPT;
    if (improveMode && currentNodes?.length) {
      systemPrompt += IMPROVE_SUFFIX + JSON.stringify(currentNodes);
    }

    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
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

    return NextResponse.json({ ready: false, question: content.slice(0, 300), hint: "" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de la génération." }, { status: 500 });
  }
}
