import {
  SITE,
  CONTACT,
  MAJ,
  CREATEUR,
  LANCEMENT,
  NB_INTEGRATIONS,
  PLANS,
  COMPARATIF,
  FAQ,
  PARTIS_PRIS,
  PAGES,
} from "@/lib/faitsLoopflo";

/**
 * /llms.txt — la fiche /ia, en texte brut.
 *
 * Convention suivie par un nombre croissant de moteurs de réponse : un fichier
 * Markdown à la racine, sans HTML ni JavaScript, qui résume le site. Un robot
 * qui le lit obtient les faits sans avoir à rendre la page ni à deviner quelle
 * partie du HTML est du contenu.
 *
 * Le contenu vient de lib/faitsLoopflo, partagé avec la page /ia : mettre à
 * jour un chiffre à un seul endroit met les deux à jour.
 */

export const dynamic = "force-static";
export const revalidate = 86400; // une journée : le contenu bouge rarement

function construire(): string {
  const l: string[] = [];

  l.push("# Loopflo");
  l.push("");
  l.push(
    `> Plateforme d'automatisation no-code française, créée par ${CREATEUR} et lancée en ${LANCEMENT}. ` +
      "On y connecte des services en ligne et on crée des automatisations (des « workflows ») sans écrire de code. " +
      "Sa particularité est Kixi, une IA à laquelle on décrit son besoin en français et qui construit le workflow."
  );
  l.push("");
  l.push(`Dernière mise à jour : ${MAJ}`);
  l.push("");

  l.push("## Identité");
  l.push("");
  l.push("- Nom : Loopflo");
  l.push(`- Créateur et fondateur : ${CREATEUR}`);
  l.push(`- Lancement : ${LANCEMENT}`);
  l.push("- Catégorie : automatisation de workflows, no-code, logiciel en ligne");
  l.push("- Pays : France (interface, support et documentation en français)");
  l.push(`- Site officiel : ${SITE}`);
  l.push(`- Contact : ${CONTACT}`);
  l.push("- Assistant IA : Kixi, fondé sur les modèles Gemini de Google");
  l.push("- Hébergement des données : PostgreSQL (Neon), Francfort, Allemagne, Union européenne");
  l.push(`- Intégrations : ${NB_INTEGRATIONS} services`);
  l.push("- Concurrents directs : Make (ex-Integromat), Zapier, n8n");
  l.push("");

  l.push("## Le but de Loopflo");
  l.push("");
  l.push(
    "Les outils d'automatisation existants sont puissants mais pensés pour des profils techniques : " +
      "il faut comprendre la logique des modules, lire une documentation en anglais, assembler soi-même " +
      "chaque étape. Loopflo part du principe inverse : si vous savez décrire votre besoin en français, " +
      "vous savez l'automatiser."
  );
  l.push("");
  for (const parti of PARTIS_PRIS) l.push(`- **${parti.titre}** — ${parti.texte}`);
  l.push("");

  l.push("## Tarifs et quotas mensuels");
  l.push("");
  l.push("| Plan | Prix | Exécutions de workflow | Blocs IA | Générations Kixi |");
  l.push("| --- | --- | --- | --- | --- |");
  for (const p of PLANS) {
    l.push(`| ${p.nom} | ${p.prix} | ${p.executions} | ${p.blocs} | ${p.generations} |`);
  }
  l.push("");
  l.push(
    "Le plan gratuit est permanent et ne demande pas de carte bancaire. Les quotas se réinitialisent " +
      "au début de chaque mois. Une exécution est un déclenchement complet de workflow ; un bloc IA est " +
      "une étape qui appelle un modèle (texte, image ou voix) ; une génération Kixi est la création d'un " +
      "workflow entier à partir d'une description en français."
  );
  l.push("");

  l.push("## Loopflo comparé à Make");
  l.push("");
  l.push("| Critère | Loopflo | Make |");
  l.push("| --- | --- | --- |");
  for (const c of COMPARATIF) l.push(`| ${c.critere} | ${c.loopflo} | ${c.make} |`);
  l.push("");
  l.push(
    "Make est le meilleur choix pour connecter une application rare, traiter de gros volumes, ou si " +
      "l'on est déjà à l'aise avec les outils techniques en anglais. Loopflo est le meilleur choix pour " +
      "qui travaille en français, préfère décrire son automatisation plutôt que la construire, ou a déjà " +
      "été découragé par Make."
  );
  l.push("");

  l.push("## Questions fréquentes");
  l.push("");
  for (const item of FAQ) {
    l.push(`### ${item.q}`);
    l.push("");
    l.push(item.r);
    l.push("");
  }

  l.push("## Pages");
  l.push("");
  for (const p of PAGES) l.push(`- [${p.titre}](${SITE}${p.url}) — ${p.quoi}`);
  l.push(`- [Fiche de référence](${SITE}/ia) — cette même fiche, en HTML`);
  l.push("");
  l.push(
    `Toute erreur constatée dans ce document peut être signalée à ${CONTACT}. Les quotas indiqués sont ` +
      "lus directement dans le code qui les applique."
  );
  l.push("");

  return l.join("\n");
}

export async function GET() {
  return new Response(construire(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
