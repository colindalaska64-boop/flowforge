import type { Metadata } from "next";
import "./dev.css";

// Page interne : jamais indexée par les moteurs de recherche.
// Elle est aussi bloquée dans app/robots.ts.
export const metadata: Metadata = {
  title: "Guide de développement — Loopflo (interne)",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

/**
 * Bloc de code multi-lignes.
 * Indispensable de passer le contenu via une chaîne : en JSX, des lignes de
 * texte séparées par des retours à la ligne sont recollées avec une espace,
 * ce qui transformerait « node -v \n git --version » en une seule commande.
 * Un « # » en début de ligne (ou précédé de deux espaces) est affiché en commentaire.
 */
function CodeBlock({ code }: { code: string }) {
  const lines = code.trim().split("\n");

  return (
    <pre>
      <code>
        {lines.map((line, i) => {
          const match = line.match(/^(\s*)(#.*)$/) || line.match(/^(.*?\s{2,})(#.*)$/);
          return (
            <span key={i}>
              {match ? (
                <>
                  {match[1]}
                  <span className="cm">{match[2]}</span>
                </>
              ) : (
                line
              )}
              {i < lines.length - 1 ? "\n" : ""}
            </span>
          );
        })}
      </code>
    </pre>
  );
}

const TEAM = [
  {
    initials: "CA",
    name: "Colin Authié",
    role: "Fondateur — développeur principal",
    detail: "Écrit le produit, décide de la direction, gère la prod et l'accès admin.",
  },
  {
    initials: "AB",
    name: "Achille Boulanger",
    role: "Développeur",
    detail: "Rejoint le projet. Cette page est faite pour lui.",
  },
  {
    initials: "CC",
    name: "Claude Code",
    role: "Assistant IA — Anthropic",
    detail: "Pair programming : écrit, relit et corrige du code sur demande.",
    ai: true,
  },
];

const STACK = [
  { nom: "Next.js 15 (App Router)", role: "Le socle du site. Un seul projet gère les pages et l'API.", ou: "app/" },
  { nom: "React 19 + TypeScript", role: "Les composants d'interface, avec typage pour attraper les erreurs avant la prod.", ou: "app/, components/" },
  { nom: "PostgreSQL (pilote pg)", role: "La base de données : comptes, workflows, exécutions, réglages.", ou: "lib/db.ts" },
  { nom: "NextAuth", role: "La connexion et les sessions utilisateur.", ou: "lib/authOptions.ts" },
  { nom: "@xyflow/react", role: "Le canvas de l'éditeur de workflow, avec les blocs qu'on relie à la souris.", ou: "app/dashboard/workflows/new/" },
  { nom: "Groq (Llama)", role: "Les blocs IA : générer du texte, filtrer, répondre.", ou: "lib/executor.ts" },
  { nom: "Resend + Nodemailer", role: "L'envoi d'emails : bienvenue, alertes, code admin.", ou: "lib/email.ts" },
  { nom: "Vitest", role: "Les tests automatiques de l'exécuteur.", ou: "lib/__tests__/" },
  { nom: "Vercel", role: "L'hébergement. Chaque push sur main part en production.", ou: "vercel.json" },
];

const FOLDERS = [
  { chemin: "app/", desc: "Toutes les pages ET l'API. Un dossier = une URL. app/pricing/page.tsx donne loopflo.app/pricing." },
  { chemin: "app/api/", desc: "Le back-end. Chaque route.ts répond aux requêtes du navigateur (créer un workflow, l'exécuter, etc.)." },
  { chemin: "app/dashboard/", desc: "L'espace connecté : liste des workflows, éditeur, réglages, support." },
  { chemin: "app/admin/", desc: "Le panel d'administration, réservé à Colin. Protégé par mot de passe + code envoyé par email." },
  { chemin: "components/", desc: "Les morceaux d'interface réutilisés à plusieurs endroits (boutons, navigation, modales)." },
  { chemin: "lib/", desc: "La logique métier, sans interface. Le cœur du produit est ici." },
  { chemin: "lib/executor.ts", desc: "Le fichier le plus important : 2 300 lignes qui font tourner les workflows des utilisateurs." },
  { chemin: "middleware.ts", desc: "Le videur à l'entrée : bloque l'accès à /admin et /api/admin avant même que la page se charge." },
];

const RULES = [
  {
    regle: "Les params sont asynchrones",
    detail: "En Next.js 15, il faut écrire const { id } = await params. Sans le await, ça plante au build.",
  },
  {
    regle: "Jamais de base de données dans middleware.ts",
    detail: "Le middleware tourne sur un environnement allégé (Edge) qui n'a pas accès à Postgres. Les vérifications en base se font dans la page ou la route.",
  },
  {
    regle: "export const dynamic = \"force-dynamic\"",
    detail: "À mettre en haut de toute page qui lit la base. Sinon Next.js la fige au build et elle affiche des données périmées.",
  },
  {
    regle: "requireAdmin() sur chaque page admin",
    detail: "Et getAdminOrNull() sur chaque route /api/admin. Les deux vérifient l'email admin ET le code temporaire. Une page qui oubliait ça laissait contourner la double authentification.",
  },
  {
    regle: "assertNoSSRF() avant tout fetch d'URL utilisateur",
    detail: "Un utilisateur peut mettre n'importe quelle adresse dans un bloc HTTP. Sans ce garde-fou, il pourrait viser le réseau interne du serveur.",
  },
  {
    regle: "Pas de couleurs en dur",
    detail: "On utilise les variables CSS (var(--c-text), var(--a-accent)…). Une couleur écrite en dur casse le thème sombre.",
  },
];

const CHANTIERS = [
  {
    titre: "Brancher le paiement (Stripe)",
    statut: "todo" as const,
    label: "À faire",
    prio: "Priorité 1",
    detail:
      "Aujourd'hui le site ne peut encaisser aucun euro : pas de dépendance Stripe, pas de route de paiement, et les boutons « Commencer en Pro » de la page tarifs renvoient vers l'inscription gratuite. Les plans ne changent qu'à la main depuis l'admin. Tant que ce n'est pas fait, on ne sait pas si quelqu'un est prêt à payer.",
  },
  {
    titre: "Mesurer l'usage réel des inscrits",
    statut: "todo" as const,
    label: "À faire",
    prio: "Priorité 1",
    detail:
      "16 inscrits depuis mars 2026, mais combien lancent vraiment des workflows ? Le panel admin donne la réponse : colonne « Workflows » sur /admin/users, et le graphe des exécutions sur 30 jours sur /admin.",
  },
  {
    titre: "Réparer la suite de tests",
    statut: "todo" as const,
    label: "À faire",
    prio: "Priorité 2",
    detail:
      "7 tests de lib/__tests__/executor.test.ts échouent en local : ils essaient de joindre Postgres sans identifiants configurés. Ce n'est pas un bug produit — l'exécuteur encaisse bien l'erreur — mais tant que npm run test est rouge, il ne sert plus de filet de sécurité.",
  },
  {
    titre: "Unifier les droits admin",
    statut: "todo" as const,
    label: "À faire",
    prio: "Priorité 2",
    detail:
      "Trois mécanismes cohabitent : la variable ADMIN_EMAIL (la majorité du code), la colonne users.role = 'admin' (route clean-emails) et la colonne users.is_admin (modération des templates). Il faut n'en garder qu'un.",
  },
  {
    titre: "Historique des exécutions côté utilisateur",
    statut: "later" as const,
    label: "Plus tard",
    prio: "",
    detail:
      "Les utilisateurs voient mal ce qui s'est passé quand un workflow échoue. L'admin a déjà la vue complète sur /admin/executions, il faut l'équivalent côté client.",
  },
  {
    titre: "Nettoyer les avertissements ESLint",
    statut: "later" as const,
    label: "Plus tard",
    prio: "",
    detail:
      "Cinq variables déclarées et jamais utilisées traînent (app/page.tsx, admin/demo, admin/mascot, lib/templateValidator.ts) plus deux guillemets à échapper dans OnboardingModal. Sans gravité, mais ça pollue la sortie et masque les vraies erreurs.",
  },
  {
    titre: "Refonte du panel admin",
    statut: "done" as const,
    label: "Fait",
    prio: "4 sept. 2026",
    detail:
      "Design system unifié (app/admin/admin.css), coque commune AdminShell, thème sombre fonctionnel, et surtout la double authentification appliquée partout — elle était contournable sur la fiche utilisateur.",
  },
];

export default function DevPage() {
  return (
    <main className="doc">
      <div className="doc-wrap">

        <div className="doc-flag">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>
            <strong>Page interne.</strong> Elle n&apos;est pas indexée par les moteurs de recherche et
            n&apos;apparaît nulle part dans la navigation du site. Elle reste toutefois accessible à qui
            connaît l&apos;adresse : n&apos;y mettez jamais de mot de passe, de clé d&apos;API ni de donnée client.
          </span>
        </div>

        <p className="doc-eyebrow">Loopflo · Documentation</p>
        <h1>Guide de développement</h1>
        <p className="doc-lede">
          Comment le site est construit, comment le faire tourner sur sa machine, et ce sur quoi
          on travaille en ce moment.
        </p>
        <p className="doc-updated">Dernière mise à jour : 4 septembre 2026</p>

        <nav className="doc-toc" aria-label="Sommaire">
          <ol>
            <li><a href="#equipe">L&apos;équipe</a></li>
            <li><a href="#produit">Ce que fait Loopflo</a></li>
            <li><a href="#stack">Les outils utilisés</a></li>
            <li><a href="#demarrer">Démarrer sur sa machine</a></li>
            <li><a href="#carte">La carte du code</a></li>
            <li><a href="#workflow">Le trajet d&apos;un workflow</a></li>
            <li><a href="#regles">Les règles à respecter</a></li>
            <li><a href="#chantiers">Les chantiers en cours</a></li>
            <li><a href="#roles">Qui prend quoi</a></li>
          </ol>
        </nav>

        {/* ── Équipe ── */}
        <h2 id="equipe">L&apos;équipe</h2>
        <p className="doc-sub">Trois intervenants sur le projet.</p>
        <div className="doc-grid">
          {TEAM.map(p => (
            <div className="doc-card" key={p.name}>
              <div className="doc-person">
                <span className={`doc-avatar${p.ai ? " is-ai" : ""}`}>{p.initials}</span>
                <span>
                  <span className="doc-person-name">{p.name}</span>
                  <br />
                  <span className="doc-person-role">{p.role}</span>
                </span>
              </div>
              <p style={{ fontSize: ".83rem", color: "var(--c-text2)", marginTop: ".8rem", marginBottom: 0 }}>
                {p.detail}
              </p>
            </div>
          ))}
        </div>

        {/* ── Produit ── */}
        <h2 id="produit">Ce que fait Loopflo</h2>
        <p>
          Loopflo automatise des tâches répétitives sans écrire de code. L&apos;utilisateur assemble
          des blocs sur un canvas — « quand je reçois un email », « résume-le avec l&apos;IA »,
          « envoie le résumé sur Slack » — et Loopflo exécute cette suite d&apos;actions à sa place.
        </p>
        <p>
          C&apos;est une alternative française à Zapier et Make. Environ 25 intégrations sont
          disponibles : Gmail, Google Sheets, Drive, Calendar, Slack, Discord, Telegram, WhatsApp,
          Notion, Airtable, Stripe, HubSpot, GitHub, RSS, Typeform, plus les blocs IA
          (texte, image, voix).
        </p>
        <div className="doc-note info">
          <strong>Vocabulaire</strong>
          Un <em>workflow</em> est la recette créée par l&apos;utilisateur. Une <em>exécution</em> est
          une fois où cette recette tourne. Un <em>bloc</em> (ou nœud) est une étape de la recette.
          Un <em>déclencheur</em> est le bloc de départ qui lance tout.
        </div>

        {/* ── Stack ── */}
        <h2 id="stack">Les outils utilisés</h2>
        <p className="doc-sub">Ce qu&apos;il faut connaître, et à quoi chaque brique sert.</p>
        <div className="doc-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Outil</th>
                <th>À quoi ça sert</th>
                <th>Où regarder</th>
              </tr>
            </thead>
            <tbody>
              {STACK.map(s => (
                <tr key={s.nom}>
                  <td><strong>{s.nom}</strong></td>
                  <td>{s.role}</td>
                  <td><code>{s.ou}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Démarrer ── */}
        <h2 id="demarrer">Démarrer sur sa machine</h2>
        <p className="doc-sub">Compter une petite heure la première fois, surtout pour les accès.</p>

        <ol className="doc-steps">
          <li>
            <h3>Installer les prérequis</h3>
            <p>Node.js version 20 ou plus, et Git. Vérifier avec :</p>
            <CodeBlock code={`node -v
git --version`} />
          </li>

          <li>
            <h3>Récupérer le projet</h3>
            <CodeBlock code={`git clone https://github.com/colindalaska64-boop/flowforge.git
cd flowforge
npm install`} />
          </li>

          <li>
            <h3>Créer le fichier de configuration</h3>
            <p>
              À la racine, créer un fichier nommé <code>.env.local</code>. Il contient les accès aux
              services externes. <strong>Demander les valeurs à Colin</strong> — elles ne sont jamais
              écrites dans le code ni sur cette page.
            </p>
            <CodeBlock
              code={`# Indispensable pour démarrer
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=

# Blocs IA et emails
GROQ_API_KEY=
RESEND_API_KEY=

# Chiffrement des connexions utilisateur
CONNECTIONS_SECRET=

# Optionnels — seulement si tu touches à ces blocs
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NOTION_TOKEN=
STABILITY_API_KEY=
ELEVENLABS_API_KEY=
GEMINI_API_KEY=
CRON_SECRET=`}
            />
            <div className="doc-note stop">
              <strong>Jamais dans Git</strong>
              <code>.env.local</code> ne doit jamais être commité. Si une clé se retrouve sur GitHub,
              il faut la révoquer et la régénérer — la supprimer du code ne suffit pas, elle reste
              dans l&apos;historique.
            </div>
          </li>

          <li>
            <h3>Lancer le site</h3>
            <CodeBlock code={`npm run dev`} />
            <p>Puis ouvrir <code>http://localhost:3000</code>. Les pages se rafraîchissent toutes seules à chaque modification.</p>
          </li>

          <li>
            <h3>Vérifier avant de proposer du code</h3>
            <CodeBlock
              code={`npx tsc --noEmit   # erreurs de typage
npm run lint       # style et erreurs courantes
npm run build      # ce que Vercel fera en production`}
            />
            <p>
              Si <code>npm run build</code> passe, le déploiement passera aussi. C&apos;est la vérification
              qui compte le plus.
            </p>
          </li>
        </ol>

        {/* ── Carte ── */}
        <h2 id="carte">La carte du code</h2>
        <p className="doc-sub">Environ 150 fichiers. Voici les endroits qui comptent.</p>
        <div className="doc-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dossier</th>
                <th>Contenu</th>
              </tr>
            </thead>
            <tbody>
              {FOLDERS.map(f => (
                <tr key={f.chemin}>
                  <td><code>{f.chemin}</code></td>
                  <td>{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Workflow ── */}
        <h2 id="workflow">Le trajet d&apos;un workflow</h2>
        <p className="doc-sub">
          Ce qui se passe entre le moment où un utilisateur enregistre sa recette et celui où elle tourne.
        </p>
        <div className="doc-flow">
          <div className="doc-flow-step">
            <p>1 — Création</p>
            <p>L&apos;utilisateur pose ses blocs sur le canvas. Le tout est enregistré en base au format JSON.</p>
          </div>
          <div className="doc-flow-step">
            <p>2 — Déclenchement</p>
            <p>Un webhook, une planification ou un test manuel réveille le workflow.</p>
          </div>
          <div className="doc-flow-step">
            <p>3 — Exécution</p>
            <p><code>executeWorkflow()</code> parcourt les blocs dans l&apos;ordre et exécute chacun.</p>
          </div>
          <div className="doc-flow-step">
            <p>4 — Trace</p>
            <p>Le résultat de chaque étape est stocké et visible dans le panel admin.</p>
          </div>
        </div>
        <p>
          Point important à comprendre avant de toucher à <code>lib/executor.ts</code> : les blocs
          sont reconnus <strong>par leur libellé</strong>, pas par un identifiant technique. Le code
          teste par exemple si le libellé contient « gmail » ou « condition ». C&apos;est pratique mais
          fragile : renommer un bloc dans l&apos;interface peut casser son exécution. À vérifier
          systématiquement des deux côtés.
        </p>

        {/* ── Règles ── */}
        <h2 id="regles">Les règles à respecter</h2>
        <p className="doc-sub">
          Six règles apprises en cassant des choses. Les ignorer coûte une soirée de débogage.
        </p>
        <ol className="doc-steps">
          {RULES.map(r => (
            <li key={r.regle}>
              <h3>{r.regle}</h3>
              <p style={{ fontSize: ".88rem", color: "var(--c-text2)", marginBottom: 0 }}>{r.detail}</p>
            </li>
          ))}
        </ol>

        {/* ── Chantiers ── */}
        <h2 id="chantiers">Les chantiers en cours</h2>
        <p className="doc-sub">
          L&apos;état du projet au 4 septembre 2026. Cette liste se met à jour à la main, dans
          <code>app/dev/page.tsx</code>.
        </p>

        <div className="doc-table-wrap" style={{ marginBottom: "1.5rem" }}>
          <table>
            <thead>
              <tr>
                <th>Chantier</th>
                <th>État</th>
                <th>Pourquoi</th>
              </tr>
            </thead>
            <tbody>
              {CHANTIERS.map(c => (
                <tr key={c.titre}>
                  <td style={{ minWidth: 190 }}>
                    <strong>{c.titre}</strong>
                    {c.prio && (
                      <>
                        <br />
                        <span style={{ fontSize: ".72rem", color: "var(--c-muted)" }}>{c.prio}</span>
                      </>
                    )}
                  </td>
                  <td><span className={`doc-badge ${c.statut}`}>{c.label}</span></td>
                  <td>{c.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="doc-note warn">
          <strong>La priorité du moment</strong>
          Le produit est largement construit — la distribution et l&apos;encaissement ne le sont pas.
          Avant d&apos;ajouter une intégration ou une fonctionnalité, se demander si elle rapproche
          d&apos;un premier client payant. Si la réponse est non, elle attend.
        </div>

        {/* ── Rôles ── */}
        <h2 id="roles">Qui prend quoi</h2>
        <p className="doc-sub">
          On se répartit le code par zone, pour ne pas se marcher dessus et pour savoir
          qui relit quoi.
        </p>

        <div className="doc-grid">
          <div className="doc-card">
            <div className="doc-person">
              <span className="doc-avatar">CA</span>
              <span>
                <span className="doc-person-name">Colin</span>
                <br />
                <span className="doc-person-role">Zones sensibles</span>
              </span>
            </div>
            <ul className="doc-list" style={{ marginTop: ".9rem", marginBottom: 0 }}>
              <li>Paiement et facturation</li>
              <li>Droits d&apos;accès et panel admin</li>
              <li><code>lib/executor.ts</code></li>
              <li>Mises en production</li>
            </ul>
          </div>

          <div className="doc-card">
            <div className="doc-person">
              <span className="doc-avatar">AB</span>
              <span>
                <span className="doc-person-name">Achille</span>
                <br />
                <span className="doc-person-role">Produit et interface</span>
              </span>
            </div>
            <ul className="doc-list" style={{ marginTop: ".9rem", marginBottom: 0 }}>
              <li>Pages publiques et responsive</li>
              <li>Dashboard utilisateur</li>
              <li>Suite de tests</li>
              <li>Nouvelles fonctionnalités</li>
            </ul>
          </div>

          <div className="doc-card">
            <div className="doc-person">
              <span className="doc-avatar is-ai">CC</span>
              <span>
                <span className="doc-person-name">Claude Code</span>
                <br />
                <span className="doc-person-role">À la demande</span>
              </span>
            </div>
            <ul className="doc-list" style={{ marginTop: ".9rem", marginBottom: 0 }}>
              <li>Relecture de code</li>
              <li>Refontes et nettoyages</li>
              <li>Recherche dans le projet</li>
              <li>Tâches ponctuelles</li>
            </ul>
          </div>
        </div>

        <div className="doc-note info">
          <strong>Pourquoi cette répartition</strong>
          Elle ne dit rien du niveau de chacun : elle sépare le code où une erreur se corrige
          d&apos;un commit, de celui où une erreur coûte de l&apos;argent ou ouvre un accès. Ces
          zones-là restent à une seule paire de mains le temps qu&apos;on ait des habitudes
          communes. Elles s&apos;ouvriront ensuite. Rien n&apos;est figé — si un sujet
          t&apos;intéresse, demande, on regarde ensemble.
        </div>

        <h3>Les deux fichiers à lire en arrivant</h3>
        <p>
          Loopflo exécute des instructions écrites par ses utilisateurs : des adresses web dans
          les blocs HTTP, du texte dans les templates. Tout ce qui vient d&apos;eux est traité
          comme hostile par défaut. Deux fichiers concentrent cette approche, ils valent une
          lecture avant de toucher au reste :
        </p>
        <ul className="doc-list">
          <li>
            <code>lib/ssrf.ts</code> — pourquoi on ne fait jamais un <code>fetch</code> sur une
            adresse fournie par un utilisateur sans la valider d&apos;abord.
          </li>
          <li>
            <code>lib/templateSanitizer.ts</code> — comment on nettoie le contenu avant de
            l&apos;afficher ou de le partager.
          </li>
        </ul>

        <h3>Comment on travaille</h3>
        <ul className="doc-list">
          <li>Une branche par sujet, jamais de commit direct sur <code>main</code>.</li>
          <li><code>npm run build</code> doit passer avant de proposer le code.</li>
          <li>Un push sur <code>main</code> part en production immédiatement, via Vercel. Pas de filet.</li>
          <li>Pour annuler un déploiement raté : <code>git revert &lt;identifiant du commit&gt;</code>.</li>
          <li>Messages de commit en français, avec un préfixe : <code>feat</code>, <code>fix</code>, <code>refonte</code>.</li>
        </ul>

        <p className="doc-foot">
          Page interne, non indexée et hors navigation · Loopflo · Rédigée le 4 septembre 2026
        </p>
      </div>
    </main>
  );
}
