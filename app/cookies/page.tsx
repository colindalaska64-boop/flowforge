import LegalLayout from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique des cookies — Loopflo",
  description: "Quels cookies utilise Loopflo, pourquoi, et comment les gérer.",
};

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Politique des cookies"
      subtitle="Quels cookies nous utilisons et comment les gérer."
      lastUpdate="26 avril 2026"
    >
      <h2>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette, mobile) lors
        de votre navigation sur un site internet. Il permet au site de vous reconnaître, de mémoriser vos
        préférences, ou de mesurer son audience.
      </p>

      <h2>2. Notre approche</h2>
      <p>
        Loopflo a une approche <strong>minimaliste</strong> des cookies. Nous n&apos;utilisons aucun cookie
        publicitaire, ni cookie de profilage tiers. Aucune information personnelle n&apos;est partagée avec
        des plateformes publicitaires (Google Ads, Meta, etc.).
      </p>

      <h2>3. Cookies utilisés</h2>
      <h3>3.1 Cookies strictement nécessaires (sans consentement requis)</h3>
      <table>
        <thead>
          <tr><th>Nom</th><th>Émetteur</th><th>Finalité</th><th>Durée</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>next-auth.session-token</code></td>
            <td>Loopflo</td>
            <td>Maintien de votre session de connexion</td>
            <td>30 jours</td>
          </tr>
          <tr>
            <td><code>next-auth.csrf-token</code></td>
            <td>Loopflo</td>
            <td>Protection contre les attaques CSRF lors de la connexion</td>
            <td>Session</td>
          </tr>
          <tr>
            <td><code>next-auth.callback-url</code></td>
            <td>Loopflo</td>
            <td>Redirection après connexion OAuth</td>
            <td>Session</td>
          </tr>
          <tr>
            <td><code>admin-auth</code></td>
            <td>Loopflo</td>
            <td>Authentification admin (uniquement pour les comptes administrateurs)</td>
            <td>2 heures</td>
          </tr>
          <tr>
            <td><code>theme</code></td>
            <td>Loopflo</td>
            <td>Mémorisation de votre préférence de thème (clair/sombre)</td>
            <td>1 an</td>
          </tr>
        </tbody>
      </table>
      <p>
        Ces cookies sont indispensables au fonctionnement du Site. Sans eux, vous ne pourriez pas vous
        connecter ou utiliser les fonctionnalités principales. Conformément à la réglementation, ils ne
        nécessitent pas votre consentement préalable.
      </p>

      <h3>3.2 Cookies de mesure d&apos;audience</h3>
      <p>
        À la date de mise à jour de cette politique, Loopflo n&apos;utilise <strong>aucun outil
        d&apos;analytics tiers</strong> (Google Analytics, Plausible, etc.). Si nous décidons d&apos;en
        intégrer un à l&apos;avenir, nous mettrons cette page à jour et solliciterons votre consentement
        si nécessaire.
      </p>

      <h3>3.3 Cookies tiers (services connectés)</h3>
      <p>
        Lorsque vous connectez un service tiers à votre workflow (Google, Slack, Notion, etc.), des
        cookies peuvent être déposés par ces services lors du processus d&apos;authentification OAuth.
        Loopflo n&apos;a aucun contrôle sur ces cookies. Consultez les politiques de chaque service pour
        plus d&apos;informations.
      </p>

      <h2>4. Stockage local</h2>
      <p>
        En complément des cookies, Loopflo utilise le <code>localStorage</code> de votre navigateur pour
        sauvegarder certaines préférences locales (état de l&apos;éditeur, brouillons de workflows non
        sauvegardés). Ces données restent uniquement sur votre appareil et ne sont jamais transmises à
        nos serveurs.
      </p>

      <h2>5. Comment gérer vos cookies ?</h2>
      <p>
        Vous pouvez à tout moment configurer votre navigateur pour bloquer ou supprimer les cookies. Voici
        les liens vers les guides officiels :
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a></li>
        <li><a href="https://support.mozilla.org/fr/kb/effacer-cookies-donnees-site-firefox" target="_blank" rel="noopener noreferrer">Firefox</a></li>
        <li><a href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
        <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge" target="_blank" rel="noopener noreferrer">Edge</a></li>
      </ul>
      <p>
        <strong>Attention :</strong> bloquer les cookies strictement nécessaires (session, CSRF) empêchera
        l&apos;accès à votre compte Loopflo.
      </p>

      <h2>6. Modifications</h2>
      <p>
        Cette politique peut évoluer. Les modifications seront publiées sur cette page avec la date de
        mise à jour.
      </p>

      <h2>7. Contact</h2>
      <p>
        Pour toute question :{" "}
        <a href="mailto:loopflo.contact@gmail.com">loopflo.contact@gmail.com</a>
      </p>
    </LegalLayout>
  );
}
