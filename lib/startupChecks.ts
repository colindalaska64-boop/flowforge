/**
 * Startup security checks — appelé au boot du serveur.
 *
 * En production, si une variable critique est absente,
 * le process crash immédiatement avec un message clair.
 * Mieux vaut un crash visible qu'une faille silencieuse.
 */

type CheckResult = { ok: boolean; key: string; message: string };

// Variables OBLIGATOIRES en production — l'app ne doit pas démarrer sans elles
const REQUIRED_PROD: Array<{ key: string; why: string }> = [
  { key: "NEXTAUTH_SECRET",    why: "Signature des sessions JWT — sans ça, les sessions sont non sécurisées" },
  { key: "DATABASE_URL",       why: "Connexion PostgreSQL — sans ça, aucune donnée ne peut être lue/écrite" },
  { key: "CRON_SECRET",        why: "Protection des routes cron/cleanup — sans ça, n'importe qui peut lancer le cron" },
  { key: "NEXTAUTH_URL",       why: "URL de base NextAuth — requis pour les redirections OAuth et les callbacks" },
];

// Variables FORTEMENT recommandées — warning sans crash
const RECOMMENDED: Array<{ key: string; why: string }> = [
  { key: "CONNECTIONS_SECRET", why: "Chiffrement AES-256-GCM des tokens API utilisateurs — sans ça, les clés sont stockées en clair" },
  { key: "ADMIN_EMAIL",        why: "Email de l'administrateur — sans ça, le panel admin est inaccessible" },
  { key: "GROQ_API_KEY",       why: "Clé Groq — les blocs IA ne fonctionneront pas" },
];

function checkEnv(): { errors: CheckResult[]; warnings: CheckResult[] } {
  const errors: CheckResult[] = [];
  const warnings: CheckResult[] = [];

  // Pas de checks stricts en dev/test ni pendant le build Next.js
  // (NEXT_PHASE = "phase-production-build" lors du `next build`)
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return { errors, warnings };
  }

  for (const { key, why } of REQUIRED_PROD) {
    if (!process.env[key] || process.env[key]!.trim().length < 8) {
      errors.push({ ok: false, key, message: why });
    }
  }

  for (const { key, why } of RECOMMENDED) {
    if (!process.env[key] || process.env[key]!.trim().length < 8) {
      warnings.push({ ok: false, key, message: why });
    }
  }

  return { errors, warnings };
}

let checked = false;

/**
 * Lance les checks au premier appel, idempotent ensuite.
 * À appeler dans lib/db.ts ou au premier import serveur.
 */
export function runStartupChecks(): void {
  if (checked) return;
  checked = true;

  const { errors, warnings } = checkEnv();

  if (warnings.length > 0) {
    for (const w of warnings) {
      console.warn(`[SECURITY WARNING] Variable manquante: ${w.key}\n  → ${w.message}`);
    }
  }

  if (errors.length > 0) {
    const lines = errors.map(e => `  ✗ ${e.key}: ${e.message}`).join("\n");
    const msg = `\n\n🚨 LOOPFLO STARTUP FAILED — Variables d'environnement critiques manquantes :\n${lines}\n\nAjoutez ces variables dans Vercel → Settings → Environment Variables.\n`;
    console.error(msg);
    // En production, on crash volontairement plutôt que de tourner de façon non sécurisée
    process.exit(1);
  }
}
