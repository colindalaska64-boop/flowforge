import LegalLayout from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CGU — Conditions Générales d'Utilisation — Loopflo",
  description: "Conditions générales d'utilisation du service Loopflo.",
};

export default function CGUPage() {
  return (
    <LegalLayout
      title="Conditions Générales d'Utilisation"
      subtitle="Les règles d'utilisation du service Loopflo, applicables à tous les utilisateurs."
      lastUpdate="26 avril 2026"
    >
      <h2>Article 1 — Objet</h2>
      <p>
        Les présentes Conditions Générales d&apos;Utilisation (« CGU ») régissent l&apos;accès et
        l&apos;utilisation du service Loopflo (« le Service »), accessible à l&apos;adresse{" "}
        <a href="https://loopflo.app">loopflo.app</a>, édité par l&apos;éditeur identifié dans les{" "}
        <a href="/mentions-legales">mentions légales</a>.
      </p>
      <p>
        Loopflo est une plateforme d&apos;automatisation de workflows en ligne, permettant à
        l&apos;utilisateur de créer, configurer et exécuter des automatisations connectant divers
        services tiers (« Workflows »).
      </p>
      <p>
        En créant un compte ou en utilisant le Service, l&apos;utilisateur reconnaît avoir pris
        connaissance des CGU et les accepter sans réserve.
      </p>

      <h2>Article 2 — Création de compte</h2>
      <p>
        L&apos;accès au Service nécessite la création d&apos;un compte. L&apos;utilisateur s&apos;engage à :
      </p>
      <ul>
        <li>Fournir des informations exactes, complètes et à jour</li>
        <li>Choisir un mot de passe sécurisé et le garder confidentiel</li>
        <li>Ne pas créer de faux compte ou usurper l&apos;identité d&apos;un tiers</li>
        <li>Avoir au minimum 16 ans, ou disposer de l&apos;autorisation parentale</li>
      </ul>
      <p>
        L&apos;utilisateur est seul responsable de toute action effectuée depuis son compte. Toute
        suspicion d&apos;accès frauduleux doit être signalée immédiatement à{" "}
        <a href="mailto:loopflo.contact@gmail.com">loopflo.contact@gmail.com</a>.
      </p>

      <h2>Article 3 — Utilisation acceptable</h2>
      <p>L&apos;utilisateur s&apos;engage à utiliser le Service de manière loyale. Il est <strong>strictement interdit</strong> de :</p>
      <ul>
        <li>Utiliser le Service à des fins illégales, frauduleuses ou contraires aux bonnes mœurs</li>
        <li>Envoyer du spam, des messages non sollicités, ou tout contenu illicite</li>
        <li>Tenter de contourner les limites d&apos;usage du plan souscrit</li>
        <li>Tenter d&apos;accéder à des comptes d&apos;autres utilisateurs ou aux systèmes de Loopflo</li>
        <li>Utiliser le Service pour des activités de scraping massif, attaques, ou pour distribuer des malwares</li>
        <li>Reproduire, copier, modifier, vendre ou redistribuer le Service ou son code source</li>
        <li>Créer des workflows visant à automatiser de la fraude (vente de produits contrefaits, phishing, etc.)</li>
      </ul>
      <p>
        Toute violation peut entraîner la <strong>suspension immédiate</strong> du compte, sans préavis ni
        remboursement, et le cas échéant des poursuites judiciaires.
      </p>

      <h2>Article 4 — Plans et limites d&apos;usage</h2>
      <p>
        Loopflo propose plusieurs plans (Gratuit, Starter, Pro, Business). Chaque plan donne accès à un
        certain volume d&apos;exécutions, de workflows actifs, et de fonctionnalités. Les détails sont
        consultables sur la page <a href="/pricing">Tarifs</a>.
      </p>
      <p>
        En cas de dépassement des limites du plan, certaines fonctionnalités peuvent être restreintes
        jusqu&apos;à la fin du cycle de facturation, ou jusqu&apos;à mise à niveau du plan.
      </p>

      <h2>Article 5 — Données et workflows de l&apos;utilisateur</h2>
      <p>
        L&apos;utilisateur reste seul propriétaire des données qu&apos;il importe ou crée sur Loopflo
        (workflows, configurations, contenus traités). Loopflo n&apos;exploite ces données que pour la
        fourniture du Service, conformément à la <a href="/confidentialite">politique de confidentialité</a>.
      </p>
      <p>
        L&apos;utilisateur garantit qu&apos;il dispose des droits nécessaires sur les données utilisées
        dans ses workflows (notamment les contenus traités par les blocs IA, et les destinataires
        d&apos;emails ou de messages envoyés).
      </p>

      <h2>Article 6 — Disponibilité du Service</h2>
      <p>
        Loopflo s&apos;efforce d&apos;assurer un taux de disponibilité élevé, sans toutefois garantir une
        disponibilité de 100%. Le Service peut être interrompu pour des opérations de maintenance, des
        mises à jour, ou en cas de force majeure (panne d&apos;infrastructure tierce, attaque, etc.).
      </p>
      <p>
        Aucune indemnité ne sera due en cas d&apos;interruption ponctuelle, sauf clause contraire prévue
        dans un contrat spécifique pour les plans Business.
      </p>

      <h2>Article 7 — Propriété intellectuelle</h2>
      <p>
        Le Service, son code source, son design, sa marque et tous les éléments qui le composent sont la
        propriété exclusive de Loopflo. Toute reproduction est interdite sans autorisation expresse.
      </p>
      <p>
        L&apos;utilisateur accorde à Loopflo une licence limitée, non exclusive, mondiale, gratuite, pour
        traiter ses données dans la stricte mesure nécessaire à l&apos;exécution de ses workflows.
      </p>

      <h2>Article 8 — Suspension et résiliation</h2>
      <p>
        L&apos;utilisateur peut supprimer son compte à tout moment depuis ses paramètres. La suppression
        entraîne la perte définitive de tous les workflows, exécutions et données associées dans un délai
        de 30 jours.
      </p>
      <p>
        Loopflo se réserve le droit de suspendre ou résilier un compte en cas de :
      </p>
      <ul>
        <li>Violation des présentes CGU</li>
        <li>Non-paiement d&apos;un plan payant</li>
        <li>Usage abusif ou frauduleux du Service</li>
        <li>Inactivité prolongée (plus de 24 mois pour les comptes gratuits)</li>
      </ul>
      <p>
        En cas de bannissement, l&apos;utilisateur peut soumettre une demande de réactivation depuis la
        page de connexion. La décision finale appartient à Loopflo. Le compte est définitivement supprimé
        30 jours après le bannissement.
      </p>

      <h2>Article 9 — Limitation de responsabilité</h2>
      <p>
        Loopflo agit comme intermédiaire technique. Le service est fourni « en l&apos;état », sans
        garantie expresse ou implicite quant à son adéquation à un usage particulier.
      </p>
      <p>
        Loopflo ne saurait être tenu responsable :
      </p>
      <ul>
        <li>Des erreurs ou pertes de données causées par des services tiers connectés (Gmail, Slack, etc.)</li>
        <li>Des dommages indirects (perte de chiffre d&apos;affaires, perte de clientèle, etc.)</li>
        <li>De l&apos;utilisation faite des contenus générés par les blocs IA (relus et validés par l&apos;utilisateur)</li>
        <li>De l&apos;impossibilité d&apos;accéder au Service en cas de force majeure</li>
      </ul>
      <p>
        En tout état de cause, la responsabilité totale de Loopflo est limitée au montant payé par
        l&apos;utilisateur au cours des 12 derniers mois.
      </p>

      <h2>Article 10 — Modifications des CGU</h2>
      <p>
        Loopflo peut modifier les CGU à tout moment. Les utilisateurs seront informés des modifications
        substantielles par email au moins 30 jours avant leur entrée en vigueur. La poursuite de
        l&apos;utilisation du Service après cette date vaut acceptation des nouvelles CGU.
      </p>

      <h2>Article 11 — Droit applicable et litiges</h2>
      <p>
        Les présentes CGU sont régies par le droit français. En cas de litige, les parties s&apos;engagent
        à rechercher une solution amiable avant toute action judiciaire. À défaut, les tribunaux français
        seront seuls compétents.
      </p>
      <p>
        Conformément à la directive européenne sur le règlement extrajudiciaire, les consommateurs peuvent
        également utiliser la plateforme RLL :{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>.
      </p>

      <h2>Article 12 — Contact</h2>
      <p>
        Pour toute question relative aux présentes CGU :{" "}
        <a href="mailto:loopflo.contact@gmail.com">loopflo.contact@gmail.com</a>
      </p>
    </LegalLayout>
  );
}
