import LegalLayout from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CGV — Conditions Générales de Vente — Loopflo",
  description: "Conditions générales de vente des plans payants Loopflo (Starter, Pro, Business).",
};

export default function CGVPage() {
  return (
    <LegalLayout
      title="Conditions Générales de Vente"
      subtitle="Conditions applicables aux plans payants (Starter, Pro, Business)."
      lastUpdate="26 avril 2026"
    >
      <h2>Article 1 — Objet et acceptation</h2>
      <p>
        Les présentes Conditions Générales de Vente (« CGV ») régissent les relations contractuelles entre
        l&apos;éditeur de Loopflo (« le Vendeur ») et toute personne physique ou morale souscrivant un plan
        payant du Service (« le Client »).
      </p>
      <p>
        Toute souscription emporte acceptation pleine et entière des présentes CGV, ainsi que des{" "}
        <a href="/cgu">CGU</a> et de la <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>Article 2 — Description des services</h2>
      <p>
        Loopflo propose plusieurs plans d&apos;abonnement détaillés sur la page <a href="/pricing">Tarifs</a> :
      </p>
      <ul>
        <li><strong>Gratuit</strong> — accès limité, sans engagement</li>
        <li><strong>Starter</strong> — usage individuel, plus d&apos;exécutions</li>
        <li><strong>Pro</strong> — usage professionnel, blocs IA illimités</li>
        <li><strong>Business</strong> — équipes, support prioritaire, SLA</li>
      </ul>
      <p>
        Le contenu détaillé de chaque plan (limites, fonctionnalités) est disponible sur la page Tarifs et
        peut être mis à jour. Les modifications n&apos;affectent pas les abonnements en cours, qui
        bénéficient des conditions souscrites jusqu&apos;à leur prochaine échéance.
      </p>

      <h2>Article 3 — Prix</h2>
      <p>
        Les prix sont indiqués en euros, toutes taxes comprises (TTC) pour les particuliers, et hors taxes
        (HT) pour les professionnels établis en Union européenne disposant d&apos;un numéro de TVA
        intracommunautaire valide.
      </p>
      <p>
        La TVA française s&apos;applique au taux en vigueur (20% à la date de rédaction). Pour les Clients
        professionnels hors France mais en UE, le mécanisme d&apos;autoliquidation s&apos;applique.
      </p>
      <p>
        Le Vendeur se réserve le droit de modifier ses tarifs à tout moment, mais s&apos;engage à appliquer
        les tarifs en vigueur au moment de la souscription pour toute la durée de l&apos;abonnement en cours.
      </p>

      <h2>Article 4 — Paiement</h2>
      <p>
        Les paiements sont gérés par <strong>Stripe Payments Europe Ltd.</strong>, prestataire agréé. Loopflo
        ne stocke <strong>aucune donnée bancaire</strong>. Les moyens de paiement acceptés sont :
      </p>
      <ul>
        <li>Carte bancaire (Visa, Mastercard, American Express)</li>
        <li>Prélèvement SEPA (selon disponibilité)</li>
      </ul>
      <p>
        Le paiement est dû à la souscription, puis automatiquement renouvelé à chaque échéance selon la
        périodicité choisie (mensuelle ou annuelle). Une facture est émise à chaque paiement et envoyée par
        email, et reste accessible dans l&apos;espace utilisateur.
      </p>

      <h2>Article 5 — Durée et renouvellement</h2>
      <p>
        Les abonnements sont conclus pour une durée d&apos;<strong>un mois</strong> ou d&apos;<strong>un an</strong>,
        selon le plan choisi, et se renouvellent <strong>tacitement</strong> par périodes équivalentes, sauf
        résiliation par le Client.
      </p>

      <h2>Article 6 — Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L.221-18 du Code de la consommation, les Clients consommateurs
        disposent d&apos;un délai de <strong>14 jours</strong> à compter de la souscription pour exercer
        leur droit de rétractation, sans avoir à motiver leur décision.
      </p>
      <p>
        <strong>Important :</strong> en commençant à utiliser activement le Service avant la fin du délai
        de 14 jours, le Client renonce expressément à son droit de rétractation, conformément à
        l&apos;article L.221-28 13° du Code de la consommation (services pleinement exécutés).
      </p>
      <p>
        Pour exercer son droit, le Client peut envoyer une demande à{" "}
        <a href="mailto:loopflo.contact@gmail.com">loopflo.contact@gmail.com</a> avec ses coordonnées et le
        motif de la demande.
      </p>

      <h2>Article 7 — Résiliation</h2>
      <p>
        Le Client peut résilier son abonnement à tout moment depuis ses paramètres ou en envoyant une
        demande à <a href="mailto:loopflo.contact@gmail.com">loopflo.contact@gmail.com</a>. La résiliation
        prend effet à la fin de la période de facturation en cours.
      </p>
      <p>
        Aucun remboursement prorata temporis ne sera effectué pour la période entamée, sauf cas exceptionnel
        et accord du Vendeur.
      </p>
      <p>
        Le Vendeur se réserve le droit de résilier l&apos;abonnement de plein droit en cas de :
      </p>
      <ul>
        <li>Non-paiement persistant après 7 jours de mise en demeure</li>
        <li>Violation des CGU</li>
        <li>Usage abusif du Service</li>
      </ul>

      <h2>Article 8 — Remboursement</h2>
      <p>
        En dehors du droit de rétractation légal, le remboursement est laissé à l&apos;appréciation du
        Vendeur. Les cas suivants peuvent donner lieu à remboursement :
      </p>
      <ul>
        <li>Indisponibilité prolongée du Service de plus de 72h consécutives non liée à un cas de force majeure</li>
        <li>Erreur de facturation imputable au Vendeur</li>
        <li>Demande motivée dans les 30 premiers jours suivant l&apos;abonnement initial</li>
      </ul>

      <h2>Article 9 — Garantie</h2>
      <p>
        Le Vendeur garantit la conformité du Service à sa description publiée sur la page Tarifs. Il met en
        œuvre les moyens raisonnables pour assurer la disponibilité, la performance et la sécurité du
        Service, sans toutefois garantir un résultat absolu (notamment vis-à-vis des services tiers connectés).
      </p>

      <h2>Article 10 — Force majeure</h2>
      <p>
        Le Vendeur ne saurait être tenu responsable de tout manquement à ses obligations résultant d&apos;un
        cas de force majeure, tel que défini à l&apos;article 1218 du Code civil, incluant notamment les
        pannes d&apos;infrastructures tierces majeures (Vercel, Neon, Stripe, fournisseurs IA).
      </p>

      <h2>Article 11 — Données personnelles</h2>
      <p>
        Le traitement des données est régi par notre <a href="/confidentialite">politique de confidentialité</a>,
        conforme au RGPD.
      </p>

      <h2>Article 12 — Litiges</h2>
      <p>
        Les présentes CGV sont régies par le droit français. En cas de litige, les parties privilégieront
        une résolution amiable. À défaut, les tribunaux français seront seuls compétents.
      </p>
      <p>
        Les consommateurs peuvent également saisir gratuitement la plateforme européenne de règlement en
        ligne des litiges :{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          ec.europa.eu/consumers/odr
        </a>.
      </p>
    </LegalLayout>
  );
}
