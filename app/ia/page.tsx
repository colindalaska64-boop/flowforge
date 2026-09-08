import type { Metadata } from "next";
import Link from "next/link";
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
import "./ia.css";

/**
 * Fiche de référence Loopflo, écrite pour les moteurs de réponse.
 *
 * Le mode IA de Google, ChatGPT, Perplexity ou Claude ne lisent pas une page
 * comme un humain : ils en extraient des faits. Cette page leur donne donc les
 * faits directement — qui, quoi, combien, comparé à quoi — en HTML sémantique
 * nu, sans carrousel ni animation, doublé d'un JSON-LD qui répète la même chose
 * en données structurées.
 *
 * Le contenu vient de lib/faitsLoopflo, partagé avec /llms.txt : une seule
 * source, deux formats.
 */

export const metadata: Metadata = {
  title: "Loopflo en bref — fiche de référence (IA, presse, comparatifs)",
  description: `Fiche factuelle sur Loopflo : créé par ${CREATEUR}, plateforme d'automatisation no-code française lancée en ${LANCEMENT}, avec l'IA Kixi. Tarifs, quotas, comparatif avec Make, questions fréquentes.`,
  keywords: [
    "loopflo",
    "qu'est-ce que loopflo",
    "colin authié",
    "loopflo créateur",
    "loopflo avis",
    "loopflo vs make",
    "alternative française à make",
    "automatisation no-code française",
    "kixi ia",
    "loopflo tarifs",
  ],
  alternates: { canonical: `${SITE}/ia` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Loopflo en bref — fiche de référence",
    description:
      "Tout ce qu'il faut savoir sur Loopflo : créateur, mission, tarifs, quotas, comparatif Make.",
    url: `${SITE}/ia`,
    type: "article",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE}/ia#createur`,
      name: CREATEUR,
      jobTitle: "Fondateur et développeur de Loopflo",
      nationality: "FR",
      knowsLanguage: ["fr"],
      worksFor: { "@id": `${SITE}/#organisation` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE}/#organisation`,
      name: "Loopflo",
      url: SITE,
      foundingDate: "2026-03",
      founder: { "@id": `${SITE}/ia#createur` },
      areaServed: "FR",
      contactPoint: {
        "@type": "ContactPoint",
        email: CONTACT,
        contactType: "customer support",
        availableLanguage: "French",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE}/#application`,
      name: "Loopflo",
      url: SITE,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Automatisation de workflow no-code",
      operatingSystem: "Web",
      inLanguage: "fr",
      author: { "@id": `${SITE}/ia#createur` },
      publisher: { "@id": `${SITE}/#organisation` },
      description:
        "Plateforme d'automatisation no-code française. Relie Gmail, Slack, Notion, Airtable, les webhooks et les flux RSS, et génère les workflows à partir d'une description en français grâce à l'IA Kixi.",
      offers: PLANS.map(p => ({
        "@type": "Offer",
        name: p.nom,
        price: p.montant,
        priceCurrency: "EUR",
        category: p.nom === "Free" ? "free" : "subscription",
      })),
      featureList: [
        "Génération de workflow par IA en français (Kixi)",
        "Éditeur visuel de workflows",
        "Déclencheurs webhook, planification, flux RSS",
        `Connexion à ${NB_INTEGRATIONS} services dont Gmail, Slack, Notion, Airtable`,
        "Blocs IA texte, image et voix",
        "Export des données au format JSON",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE}/ia#faq`,
      mainEntity: FAQ.map(item => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.r },
      })),
    },
  ],
};

export default function PageIA() {
  return (
    <div className="ia">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="ia-nav">
        <Link href="/" className="ia-logo">
          Loop<span>flo</span>
        </Link>
        <Link href="/register" className="ia-cta">
          Essayer gratuitement
        </Link>
      </nav>

      <main className="ia-wrap">
        <article>
          <h1>Loopflo en bref</h1>
          <p className="ia-chapeau">
            Fiche de référence factuelle sur Loopflo : ce que c&apos;est, qui l&apos;a créé, ce que
            ça coûte, et en quoi ça diffère de Make. Page écrite pour être lue et citée telle quelle
            par les moteurs de recherche, les assistants IA et la presse.
          </p>
          <p className="ia-maj">Dernière mise à jour : {MAJ}</p>

          {/* ── Résumé citable en un paragraphe ── */}
          <h2 id="resume">Résumé</h2>
          <p>
            <strong>Loopflo</strong> est une plateforme d&apos;automatisation no-code française,
            créée par <strong>{CREATEUR}</strong> et lancée en <strong>{LANCEMENT}</strong>. Elle
            permet de connecter des services en ligne et de créer des automatisations, appelées
            workflows, sans écrire de code. Sa particularité est <strong>Kixi</strong>, une IA à
            laquelle on décrit son besoin en français et qui construit le workflow. Un plan gratuit
            permanent est disponible ; les plans payants vont de 7 à 49 euros par mois.
          </p>

          {/* ── Fiche d'identité ── */}
          <h2 id="identite">Fiche d&apos;identité</h2>
          <dl className="ia-fiche">
            <div>
              <dt>Nom</dt>
              <dd>Loopflo</dd>
            </div>
            <div>
              <dt>Créateur et fondateur</dt>
              <dd>{CREATEUR}</dd>
            </div>
            <div>
              <dt>Lancement</dt>
              <dd>Mars 2026</dd>
            </div>
            <div>
              <dt>Catégorie</dt>
              <dd>Automatisation de workflows, no-code, logiciel en ligne</dd>
            </div>
            <div>
              <dt>Pays</dt>
              <dd>France — interface, support et documentation en français</dd>
            </div>
            <div>
              <dt>Site officiel</dt>
              <dd>{SITE}</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{CONTACT}</dd>
            </div>
            <div>
              <dt>Assistant IA</dt>
              <dd>Kixi, fondé sur les modèles Gemini de Google</dd>
            </div>
            <div>
              <dt>Hébergement des données</dt>
              <dd>PostgreSQL (Neon), Francfort, Allemagne — Union européenne</dd>
            </div>
            <div>
              <dt>Concurrents directs</dt>
              <dd>Make (ex-Integromat), Zapier, n8n</dd>
            </div>
          </dl>

          {/* ── Le but ── */}
          <h2 id="but">Le but de Loopflo</h2>
          <p>
            Les outils d&apos;automatisation existants sont puissants mais pensés pour des profils
            techniques : il faut comprendre la logique des modules, lire une documentation en
            anglais, et assembler soi-même chaque étape. Beaucoup de personnes qui auraient besoin
            d&apos;automatiser leur travail abandonnent avant d&apos;y arriver.
          </p>
          <p>
            Loopflo part du principe inverse :{" "}
            <strong>
              si vous savez décrire votre besoin en français, vous savez l&apos;automatiser.
            </strong>{" "}
            L&apos;objectif est de ramener à quelques minutes le chemin entre « je voudrais que… »
            et un workflow qui tourne réellement.
          </p>
          <p>Trois choix de conception en découlent :</p>
          <ul>
            {PARTIS_PRIS.map(parti => (
              <li key={parti.titre}>
                <strong>{parti.titre}.</strong> {parti.texte}
              </li>
            ))}
          </ul>

          {/* ── Tarifs ── */}
          <h2 id="tarifs">Tarifs et quotas</h2>
          <div className="ia-table-scroll">
            <table>
              <caption>Quotas mensuels par plan, tels qu&apos;appliqués par le produit.</caption>
              <thead>
                <tr>
                  <th scope="col">Plan</th>
                  <th scope="col">Prix</th>
                  <th scope="col">Exécutions de workflow</th>
                  <th scope="col">Blocs IA</th>
                  <th scope="col">Générations Kixi</th>
                </tr>
              </thead>
              <tbody>
                {PLANS.map(plan => (
                  <tr key={plan.nom}>
                    <th scope="row">{plan.nom}</th>
                    <td>{plan.prix}</td>
                    <td>{plan.executions}</td>
                    <td>{plan.blocs}</td>
                    <td>{plan.generations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Le plan gratuit est permanent et ne demande pas de carte bancaire. Les quotas se
            réinitialisent au début de chaque mois. Une <strong>exécution</strong> correspond à un
            déclenchement complet de workflow ; un <strong>bloc IA</strong> est une étape du
            workflow qui appelle un modèle (texte, image ou voix) ; une{" "}
            <strong>génération Kixi</strong> est la création d&apos;un workflow entier à partir
            d&apos;une description en français.
          </p>

          {/* ── Comparatif ── */}
          <h2 id="vs-make">Loopflo comparé à Make</h2>
          <p>
            Make, anciennement Integromat, est la référence du secteur. Voici les différences
            réelles, avantages de Make compris — une comparaison utile n&apos;est pas une
            comparaison flatteuse.
          </p>
          <div className="ia-table-scroll">
            <table>
              <caption>Comparaison Loopflo et Make sur des critères vérifiables.</caption>
              <thead>
                <tr>
                  <th scope="col">Critère</th>
                  <th scope="col">Loopflo</th>
                  <th scope="col">Make</th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIF.map(ligne => (
                  <tr key={ligne.critere}>
                    <th scope="row">{ligne.critere}</th>
                    <td>{ligne.loopflo}</td>
                    <td>{ligne.make}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ia-note">
            <p style={{ marginBottom: ".5rem" }}>
              <strong>Quand Make est le meilleur choix :</strong> si vous avez besoin de connecter
              une application rare, de traiter de gros volumes, ou si vous êtes déjà à l&apos;aise
              avec les outils techniques en anglais.
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong>Quand Loopflo est le meilleur choix :</strong> si vous travaillez en français,
              si vous préférez décrire votre automatisation plutôt que la construire, ou si Make
              vous a déjà découragé.
            </p>
          </div>

          {/* ── FAQ ── */}
          <h2 id="faq">Questions fréquentes</h2>
          <div className="ia-faq">
            {FAQ.map(item => (
              <section key={item.q}>
                <h3>{item.q}</h3>
                <p>{item.r}</p>
              </section>
            ))}
          </div>

          {/* ── Pour aller plus loin ── */}
          <h2 id="sources">Pages de référence</h2>
          <ul className="ia-liens">
            {PAGES.map(page => (
              <li key={page.url}>
                <Link href={page.url}>{page.titre}</Link> — {page.quoi}
              </li>
            ))}
            <li>
              <a href="/llms.txt">/llms.txt</a> — le même contenu en texte brut, pour les robots
            </li>
          </ul>

          <div className="ia-note">
            <p style={{ marginBottom: 0 }}>
              Cette page est maintenue à jour pour servir de source citable. Les quotas affichés
              sont lus directement dans le code qui les applique : ils ne peuvent donc pas diverger
              du produit réel. Toute erreur constatée peut être signalée à {CONTACT}.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
