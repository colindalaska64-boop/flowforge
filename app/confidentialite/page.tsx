import LegalLayout from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Loopflo",
  description: "Comment Loopflo collecte, utilise et protège vos données personnelles. Conforme RGPD.",
};

export default function ConfidentialitePage() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      subtitle="Comment Loopflo collecte, utilise et protège vos données personnelles."
      lastUpdate="26 avril 2026"
    >
      <p>
        Loopflo s&apos;engage à protéger la vie privée de ses utilisateurs. La présente politique
        explique quelles données nous collectons, pourquoi, comment nous les utilisons, et quels sont
        vos droits, conformément au <strong>Règlement Général sur la Protection des Données (RGPD)</strong> et
        à la loi française « Informatique et Libertés » du 6 janvier 1978 modifiée.
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données collectées sur loopflo.app est l&apos;éditeur du Site,
        identifié dans les <a href="/mentions-legales">mentions légales</a>.
      </p>
      <p>
        <strong>Contact :</strong> <a href="mailto:loopflo.contact@gmail.com">loopflo.contact@gmail.com</a>
      </p>

      <h2>2. Données collectées</h2>

      <h3>2.1 Lors de la création de compte</h3>
      <ul>
        <li><strong>Email</strong> — pour identifier votre compte et communiquer avec vous</li>
        <li><strong>Nom</strong> — pour personnaliser l&apos;interface et nos communications</li>
        <li><strong>Mot de passe</strong> — stocké sous forme chiffrée (bcrypt, jamais en clair)</li>
      </ul>

      <h3>2.2 Lors de l&apos;utilisation du service</h3>
      <ul>
        <li><strong>Workflows et configurations</strong> — les automatisations que vous créez</li>
        <li><strong>Historique d&apos;exécution</strong> — résultats, erreurs, dates des exécutions (conservés 90 jours)</li>
        <li><strong>Connexions à des services tiers</strong> — clés API, tokens OAuth (chiffrés AES-256-GCM)</li>
        <li><strong>Logs techniques</strong> — adresse IP, pages visitées, erreurs, dates de connexion</li>
      </ul>

      <h3>2.3 Données de facturation (plans payants)</h3>
      <p>
        Les paiements sont gérés par <strong>Stripe</strong>. Loopflo ne stocke <strong>aucune donnée de
        carte bancaire</strong>. Stripe collecte les informations de paiement nécessaires conformément à sa
        propre politique de confidentialité.
      </p>

      <h2>3. Finalités et bases légales</h2>
      <table>
        <thead>
          <tr><th>Finalité</th><th>Base légale</th><th>Durée de conservation</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Création et gestion de votre compte</td>
            <td>Exécution du contrat (CGU)</td>
            <td>Tant que votre compte est actif, puis 30 jours</td>
          </tr>
          <tr>
            <td>Exécution des workflows</td>
            <td>Exécution du contrat</td>
            <td>Tant que votre compte est actif</td>
          </tr>
          <tr>
            <td>Historique d&apos;exécution</td>
            <td>Intérêt légitime (debug, support)</td>
            <td>90 jours</td>
          </tr>
          <tr>
            <td>Facturation</td>
            <td>Obligation légale</td>
            <td>10 ans (obligations comptables)</td>
          </tr>
          <tr>
            <td>Communications de service (emails)</td>
            <td>Exécution du contrat</td>
            <td>Tant que votre compte est actif</td>
          </tr>
          <tr>
            <td>Communications marketing (newsletter)</td>
            <td>Consentement</td>
            <td>Jusqu&apos;à désinscription</td>
          </tr>
          <tr>
            <td>Sécurité et prévention des abus</td>
            <td>Intérêt légitime</td>
            <td>1 an (logs de connexion, IP)</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Destinataires des données</h2>
      <p>
        Vos données ne sont jamais vendues, louées ou cédées à des tiers à des fins commerciales. Elles
        peuvent être transmises uniquement aux acteurs suivants, dans la stricte mesure nécessaire :
      </p>
      <ul>
        <li><strong>Vercel</strong> (États-Unis) — hébergement de l&apos;application</li>
        <li><strong>Neon</strong> (États-Unis, base en UE) — hébergement de la base PostgreSQL</li>
        <li><strong>Stripe</strong> (Irlande/États-Unis) — traitement des paiements</li>
        <li><strong>Resend</strong> (États-Unis) — envoi d&apos;emails transactionnels</li>
        <li><strong>Groq</strong> (États-Unis) — traitement IA des prompts pour Kixi et les blocs IA</li>
        <li>Services tiers que vous connectez vous-même (Gmail, Slack, Notion, etc.) selon vos workflows</li>
      </ul>
      <p>
        Les transferts hors UE s&apos;appuient sur les <strong>Clauses Contractuelles Types</strong> (CCT) de
        la Commission européenne ou sur des décisions d&apos;adéquation (Data Privacy Framework pour les
        États-Unis depuis juillet 2023).
      </p>

      <h2>5. Sécurité</h2>
      <p>Loopflo applique des mesures techniques et organisationnelles strictes :</p>
      <ul>
        <li>Connexion HTTPS obligatoire (TLS 1.3)</li>
        <li>Mots de passe stockés avec bcrypt (cost factor 12)</li>
        <li>Clés API et tokens OAuth chiffrés en base avec AES-256-GCM</li>
        <li>Verrouillage automatique des comptes après 5 tentatives de connexion échouées</li>
        <li>Protection SSRF des requêtes HTTP sortantes (blocage des IPs privées)</li>
        <li>Audit des accès admin et logs de connexion conservés 1 an</li>
      </ul>

      <h2>6. Vos droits</h2>
      <p>Conformément au RGPD, vous disposez des droits suivants :</p>
      <ul>
        <li><strong>Droit d&apos;accès</strong> — obtenir une copie de vos données (export JSON disponible dans <code>Paramètres &gt; Mes données</code>)</li>
        <li><strong>Droit de rectification</strong> — corriger les données inexactes vous concernant</li>
        <li><strong>Droit à l&apos;effacement</strong> — supprimer votre compte et vos données (bouton dans les paramètres)</li>
        <li><strong>Droit à la portabilité</strong> — récupérer vos données dans un format réutilisable (JSON)</li>
        <li><strong>Droit d&apos;opposition</strong> — refuser certains traitements (notamment marketing)</li>
        <li><strong>Droit à la limitation</strong> — demander le gel temporaire d&apos;un traitement</li>
        <li><strong>Droit de retirer votre consentement</strong> à tout moment, sans affecter la licéité du traitement antérieur</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez-nous à{" "}
        <a href="mailto:loopflo.contact@gmail.com">loopflo.contact@gmail.com</a>. Une réponse vous sera
        apportée dans un délai maximum d&apos;un mois.
      </p>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès
        de la <strong>CNIL</strong> (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">cnil.fr</a>).
      </p>

      <h2>7. Cookies</h2>
      <p>
        Le Site utilise un nombre minimal de cookies, principalement techniques. Pour le détail, consultez
        notre <a href="/cookies">politique des cookies</a>.
      </p>

      <h2>8. Modifications</h2>
      <p>
        Loopflo peut modifier la présente politique pour refléter des évolutions légales ou techniques.
        Toute modification substantielle vous sera notifiée par email avant sa prise d&apos;effet.
      </p>

      <h2>9. Contact</h2>
      <p>
        Pour toute question concernant vos données personnelles :{" "}
        <a href="mailto:loopflo.contact@gmail.com">loopflo.contact@gmail.com</a>
      </p>
    </LegalLayout>
  );
}
