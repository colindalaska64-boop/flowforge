import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import Groq from "groq-sdk";
import { checkAiLimit, recordAiUsage } from "@/lib/ai-limits";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Tu es Kixi, l'assistant IA de Loopflo. Tu es enthousiaste, précis et efficace. Tu réponds TOUJOURS en français. Tu poses AU MAXIMUM 1 question courte si une information CRITIQUE manque. Sinon, génère le JSON IMMÉDIATEMENT.

RÈGLE D'OR : Si le message mentionne un déclencheur (webhook, schedule, gmail, slack...) ET une action, génère DIRECTEMENT sans question.

══════════════════════════════════════
BLOCS DISPONIBLES
══════════════════════════════════════
TRIGGERS:
  webhook(description, expected_field)
  schedule(schedule, timezone)        ← schedule est un objet JSON
  slack_event(description)
  github(event_type)                  ← "push","pull_request","issue"

ACTIONS EMAIL/MESSAGING:
  gmail(to, subject, body, format)    ← format: "HTML" ou "Texte brut"
  slack(webhook_url, channel, message)
  discord(webhook_url, message)
  telegram(bot_token, chat_id, message)
  sms(to_number, from_number, message, account_sid, auth_token)

ACTIONS DONNÉES:
  sheets(spreadsheet_url, sheet_name, columns, action)  ← action: "append","update","read"
  notion(database_id, title, content)
  airtable(api_key, base_id, table_name, fields)
  hubspot(api_key, email, first_name, last_name)
  http(url, method, body, auth_type)  ← method: "GET","POST","PUT","PATCH"

ACTIONS RÉSEAUX SOCIAUX:
  instagram(access_token, instagram_account_id, media_type, image_url, caption)
  youtube(client_id, client_secret, refresh_token, title, description, video_url)
  tiktok(access_token, open_id, video_url, caption)
  threads(access_token, user_id, text)
  pinterest(access_token, board_id, image_url, title, description)
  reddit(client_id, client_secret, subreddit, title, content)
  substack(publication_url, title, body)
  twitch(client_id, client_secret, broadcaster_id, event_type)
  stripe(secret_key, action, resource_id)

BLOCS IA:
  ai_filter(condition, action_if_yes, action_if_no)
  ai_generate(prompt, tone, max_words, output_var)  ← output_var ex: "texte_genere"
  ai_image(prompt, style, ratio, output_var)        ← output_var ex: "image_url"
  ai_voice(text, voice, stability, output_var)      ← output_var ex: "audio_url"
  elevenlabs(api_key, voice_id, text, output_var)
  stability(api_key, prompt, negative_prompt, aspect_ratio, output_var)
  runway(api_key, prompt, mode, duration, output_var)
  heygen(api_key, avatar_id, script, aspect_ratio, output_var)
  suno(api_key, prompt, mode, duration, output_var)

BLOCS COMPOSITES (1 bloc = plusieurs étapes intégrées — PRÉFÈRE-LES) :
  multi_notify(message, send_email, email_to, send_slack, slack_webhook, send_discord, discord_webhook, send_telegram, telegram_bot, telegram_chat)
  auto_reply(prompt, tone, max_words, channel, recipient)
  viral_short(topic, style, duration, voice, output_var)

LOGIQUE:
  condition(field, operator, value)   ← operator: "equals","contains","greater_than","less_than","exists"
  loop(array_field)

══════════════════════════════════════
LABELS EXACTS (utilise ces labels dans "label")
══════════════════════════════════════
webhook→Webhook | schedule→Planifié | gmail→Gmail | sheets→Google Sheets | http→HTTP Request
ai_filter→Filtre IA | ai_generate→Générer texte | ai_image→Générer image | ai_voice→Générer voix
slack_event→Slack Event | github→GitHub | discord→Discord | airtable→Airtable | stripe→Stripe
telegram→Telegram | sms→SMS | hubspot→HubSpot | condition→Condition | loop→Boucle
slack→Slack | notion→Notion | instagram→Instagram | youtube→YouTube | tiktok→TikTok
threads→Threads | pinterest→Pinterest | twitch→Twitch | reddit→Reddit | substack→Substack
elevenlabs→ElevenLabs | stability→Stability AI | runway→Runway | heygen→HeyGen | suno→Suno
multi_notify→Notification multi-canal | auto_reply→Réponse auto IA | viral_short→Vidéo virale courte

══════════════════════════════════════
VARIABLES — insère {{variable}} dans les champs texte
══════════════════════════════════════
Après webhook/http   : {{email}} {{name}} {{message}} {{phone}} {{amount}} {{subject}} {{status}} {{id}}
Après schedule       : {{date}} {{time}} {{day}} {{timestamp}}
Après github         : {{repo}} {{branch}} {{commit}} {{author}}
Après slack_event    : {{text}} {{user}} {{channel}}
Après "lire emails"  : {{email_subject}} {{email_from}} {{email_date}} {{email_body}} {{email_count}}
                       ⚠️ TOUJOURS utiliser {{email_body}} pour analyser ou extraire le contenu — le sujet seul ne suffit JAMAIS
                       ⚠️ Pour Filtre IA, écrire la condition de manière à utiliser le body (ex: "Le contenu est-il une facture ?")
Après ai_generate    : {{texte_genere}} (ou le output_var défini)
Après ai_image       : {{image_url}}
Après ai_voice       : {{audio_url}}
Après viral_short    : {{script}} {{audio_url}} {{image_url}}

══════════════════════════════════════
FORMATS SPÉCIAUX
══════════════════════════════════════
schedule JSON:
  Chaque jour 9h    → {"type":"daily","hour":"9","minute":"0","timezone":"Europe/Paris"}
  Lundi+vendredi    → {"type":"weekly","days":["monday","friday"],"hour":"9","minute":"0"}
  Toutes les 2h     → {"type":"hourly","intervalHours":"2"}
  1er du mois       → {"type":"monthly","dayOfMonth":"1","hour":"9","minute":"0"}

columns Google Sheets: [{"col":"A","val":"{{email}}"},{"col":"B","val":"{{name}}"},{"col":"C","val":"{{date}}"}]

Condition branches: {"from":1,"to":2,"handle":"yes"} et {"from":1,"to":3,"handle":"no"}

══════════════════════════════════════
EXEMPLES DE WORKFLOWS (inspire-toi en cas de doute)
══════════════════════════════════════

Ex 1 — "Webhook Stripe → email de confirmation" :
{"ready":true,"name":"Paiement confirmé","nodes":[
  {"type":"webhook","label":"Webhook","desc":"Reçoit le paiement Stripe","config":{"description":"Paiement Stripe","expected_field":"amount"}},
  {"type":"gmail","label":"Gmail","desc":"Email de confirmation","config":{"to":"{{email}}","subject":"Paiement reçu — {{amount}}€","body":"<p>Bonjour {{name}},</p><p>Votre paiement de {{amount}}€ a bien été reçu.</p>","format":"HTML"}}
],"edges":[{"from":0,"to":1}]}

Ex 2 — "Formulaire contact → filtre spam IA → Notion" :
{"ready":true,"name":"Contact → Notion","nodes":[
  {"type":"webhook","label":"Webhook","desc":"Formulaire contact","config":{"description":"Soumission formulaire"}},
  {"type":"ai_filter","label":"Filtre IA","desc":"Filtre les spams","config":{"condition":"Ce message est un spam ou une sollicitation commerciale","action_if_yes":"stop","action_if_no":"continue"}},
  {"type":"notion","label":"Notion","desc":"Ajoute dans la base","config":{"database_id":"","title":"{{name}} — {{subject}}","content":"{{message}}"}}
],"edges":[{"from":0,"to":1},{"from":1,"to":2,"handle":"no"}]}

Ex 3 — "Chaque lundi, générer un rapport IA et l'envoyer par Slack" :
{"ready":true,"name":"Rapport hebdo Slack","nodes":[
  {"type":"schedule","label":"Planifié","desc":"Chaque lundi 9h","config":{"schedule":"{\"type\":\"weekly\",\"days\":[\"monday\"],\"hour\":\"9\",\"minute\":\"0\"}","timezone":"Europe/Paris"}},
  {"type":"ai_generate","label":"Générer texte","desc":"Génère le rapport","config":{"prompt":"Génère un résumé d'activité hebdomadaire professionnel pour une équipe SaaS, 3 paragraphes","tone":"professionnel","max_words":"300","output_var":"rapport"}},
  {"type":"slack","label":"Slack","desc":"Envoie sur Slack","config":{"webhook_url":"","channel":"#general","message":"Rapport du {{day}} :\n\n{{rapport}}"}}
],"edges":[{"from":0,"to":1},{"from":1,"to":2}]}

Ex 4 — "Lire le dernier email, si c'est une facture extraire les données et me l'envoyer par mail" :
{"ready":true,"name":"Extraction facture email","nodes":[
  {"type":"lire_emails","label":"Lire emails","desc":"Récupère le dernier email","config":{"folder":"INBOX","filter":"Tous","max_count":"1"}},
  {"type":"ai_filter","label":"Filtre IA","desc":"Le contenu est-il une facture ?","config":{"condition":"Le contenu de l'email (sujet ET corps) correspond clairement à une facture, un reçu ou une demande de paiement","action_if_yes":"continue","action_if_no":"stop"}},
  {"type":"ai_generate","label":"Générer texte","desc":"Extrait les données de paiement","config":{"prompt":"Extrais les données de paiement de cette facture depuis le {{email_body}}. Donne-moi une liste structurée : Numéro de facture, Date, Montant HT, TVA, Montant TTC, Date d'échéance, Mode de paiement, IBAN si présent. Si une info manque, écris 'non disponible'.","tone":"neutre","max_words":"200","output_var":"extraction"}},
  {"type":"gmail","label":"Gmail","desc":"Envoie l'extraction","config":{"to":"","subject":"Données extraites — {{email_subject}}","body":"<h2>Facture détectée dans votre boîte mail</h2><p><b>Expéditeur :</b> {{email_from}}<br><b>Date :</b> {{email_date}}</p><h3>Données extraites :</h3><pre>{{extraction}}</pre>","format":"HTML"}}
],"edges":[{"from":0,"to":1},{"from":1,"to":2,"handle":"yes"},{"from":2,"to":3}]}

══════════════════════════════════════
FORMAT DE RÉPONSE
══════════════════════════════════════
Si tu as assez d'infos → réponds UNIQUEMENT avec ce JSON (rien avant, rien après) :
{"ready":true,"name":"Nom court","nodes":[...],"edges":[...]}

Si une info CRITIQUE manque (et une seule) :
{"ready":false,"question":"Ta question courte ?","hint":"exemple de réponse"}

JAMAIS de texte autour du JSON. JAMAIS de markdown. JAMAIS de \`\`\`json.`;

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

    const user = await pool.query("SELECT id, plan FROM users WHERE email = $1", [session.user?.email]);
    const plan = user.rows[0]?.plan || "free";
    const userId: number = user.rows[0]?.id;

    const { messages, improveMode, currentNodes, guideMode } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "Messages manquants." }, { status: 400 });

    // Guide mode is free for everyone — no limit check
    // Free & Starter : limite mensuelle de générations (vérifiée avant d'appeler Groq)
    if (!guideMode && (plan === "free" || plan === "starter")) {
      const firstMsg: string = messages.find((m: { role: string }) => m.role === "user")?.content ?? "";
      const lastMsg: string = [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content ?? "";
      const exchCount0: number = messages.filter((m: { role: string }) => m.role === "user").length;
      const matches0 = firstMsg.match(SERVICE_KEYWORDS) || [];
      const richFirst0 = new Set(matches0.map((s: string) => s.toLowerCase())).size >= 2;
      const wouldGenerate = exchCount0 >= 3 || READY_TRIGGERS.test(lastMsg) || richFirst0 || improveMode;
      if (wouldGenerate) {
        const { allowed } = await checkAiLimit(userId, plan);
        if (!allowed) {
          const msg = plan === "free"
            ? "Passe au plan Starter pour générer plus de workflows avec Kixi IA."
            : "Tu as utilisé toutes tes générations Kixi IA ce mois-ci. Passe au plan Pro pour une IA illimitée.";
          return NextResponse.json({ error: msg }, { status: 403 });
        }
      }
    }

    const lastUserMsg: string = [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content ?? "";
    const firstUserMsg: string = messages.find((m: { role: string }) => m.role === "user")?.content ?? "";
    const exchangeCount = messages.filter((m: { role: string }) => m.role === "user").length;

    // Detect if first message already has enough context to generate directly
    const serviceMatches = firstUserMsg.match(SERVICE_KEYWORDS) || [];
    const uniqueServices = new Set(serviceMatches.map(s => s.toLowerCase()));
    const richFirstMessage = uniqueServices.size >= 2;

    const shouldGenerate = exchangeCount >= 3 || READY_TRIGGERS.test(lastUserMsg) || richFirstMessage || improveMode;

    // Toujours le 70b — meilleure compréhension même pour les questions courtes
    const model = "llama-3.3-70b-versatile";
    const maxTokens = shouldGenerate ? 2500 : 500;

    // Build system prompt
    let systemPrompt = guideMode ? GUIDE_PROMPT : SYSTEM_PROMPT;
    if (improveMode && currentNodes?.length) {
      systemPrompt += IMPROVE_SUFFIX + JSON.stringify(currentNodes);
    }

    // Helper : essaie de parser le JSON le plus large possible dans le texte
    function tryParseJson(text: string): unknown | null {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        try { return JSON.parse(m[0]); } catch { /* try fallback */ }
      }
      // Fallback : remonte de la fin pour trouver une accolade fermante valide
      for (let i = text.length - 1; i >= 0; i--) {
        if (text[i] === "}") {
          const start = text.lastIndexOf("{", i);
          if (start !== -1) {
            try { return JSON.parse(text.slice(start, i + 1)); } catch { continue; }
          }
        }
      }
      return null;
    }

    // 1ère tentative
    let completion = await groq.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });
    let content = completion.choices[0]?.message?.content || "";
    let parsed = tryParseJson(content) as { ready?: boolean; question?: string; hint?: string; name?: string; nodes?: unknown[]; edges?: unknown[] } | null;

    // Retry 1x si on attendait du JSON et que le parse a échoué (LLM fait parfois des trailing commas ou markdown)
    if (!parsed && shouldGenerate) {
      completion = await groq.chat.completions.create({
        model,
        temperature: 0.1,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
          { role: "assistant", content },
          {
            role: "user",
            content: "Ta réponse précédente n'était pas du JSON valide. Renvoie UNIQUEMENT l'objet JSON demandé, sans markdown, sans backticks, sans texte autour. Format exact : {\"ready\":true,\"name\":\"...\",\"nodes\":[...],\"edges\":[...]}",
          },
        ],
      });
      content = completion.choices[0]?.message?.content || "";
      parsed = tryParseJson(content) as typeof parsed;
    }

    if (parsed) {
      if ((plan === "free" || plan === "starter") && parsed.ready === true && userId) {
        recordAiUsage(userId).catch(() => {});
      }
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ ready: false, question: content.slice(0, 300), hint: "" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de la génération." }, { status: 500 });
  }
}
