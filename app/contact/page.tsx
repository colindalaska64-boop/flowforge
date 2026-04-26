import LegalLayout from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Loopflo",
  description: "Contactez l'équipe Loopflo : questions, support, partenariats, presse.",
};

export default function ContactPage() {
  return (
    <LegalLayout
      title="Contact"
      subtitle="Une question ? Un bug ? Une idée ? On lit tout, et on répond vite."
    >
      <p>
        Loopflo est un projet à taille humaine. Tu écris, on répond — généralement dans les 24h ouvrées.
      </p>

      <h2>Pour les utilisateurs</h2>

      <h3>Support général</h3>
      <p>
        Pour toute question sur ton compte, un workflow qui ne marche pas, ou un service tiers à connecter :
      </p>
      <p>
        <a href="mailto:loopflo.contact@gmail.com">loopflo.contact@gmail.com</a>
      </p>
      <p>
        Tu peux aussi utiliser le bouton <strong>Support</strong> dans ton dashboard, ou suggérer une
        fonctionnalité directement depuis l&apos;éditeur de workflow (bouton « Suggestion » en haut à droite).
      </p>

      <h3>Signaler un bug</h3>
      <p>
        Si quelque chose plante, on veut le savoir tout de suite. Décris ce que tu faisais, le résultat
        obtenu et le résultat attendu :
      </p>
      <p>
        <a href="mailto:loopflo.contact@gmail.com?subject=Bug%20Loopflo">loopflo.contact@gmail.com</a> avec
        le sujet <code>Bug Loopflo</code>
      </p>

      <h3>Demande de réactivation</h3>
      <p>
        Si ton compte a été suspendu et que tu penses qu&apos;il y a une erreur, tu peux faire une demande
        de réactivation directement depuis la page de connexion (un formulaire apparaît automatiquement).
      </p>

      <hr />

      <h2>Partenariats et presse</h2>

      <h3>Presse</h3>
      <p>
        Pour toute demande presse, interview, kit média :{" "}
        <a href="mailto:loopflo.contact@gmail.com?subject=Presse">loopflo.contact@gmail.com</a> avec le
        sujet <code>Presse</code>.
      </p>
      <p>
        Le kit média (logo, screenshots, mascotte, palette de couleurs) sera mis à disposition prochainement.
      </p>

      <h3>Partenariats / intégrations</h3>
      <p>
        Tu édites un service que tu souhaites voir intégré à Loopflo, ou tu veux proposer un partenariat ?
        On en discute :{" "}
        <a href="mailto:loopflo.contact@gmail.com?subject=Partenariat">loopflo.contact@gmail.com</a> avec
        le sujet <code>Partenariat</code>.
      </p>

      <h3>Données personnelles (RGPD)</h3>
      <p>
        Pour toute demande relative à tes données personnelles (accès, suppression, rectification,
        portabilité) :{" "}
        <a href="mailto:loopflo.contact@gmail.com?subject=RGPD">loopflo.contact@gmail.com</a> avec le sujet{" "}
        <code>RGPD</code>. Réponse sous 30 jours maximum, comme le prévoit la loi.
      </p>

      <hr />

      <h2>Adresse postale</h2>
      <span className="placeholder">⚠ À COMPLÉTER : adresse postale officielle de l&apos;éditeur (obligatoire pour les courriers recommandés).</span>

      <h2>Liens utiles</h2>
      <ul>
        <li><a href="/faq">FAQ</a> — réponses aux questions les plus fréquentes</li>
        <li><a href="/pricing">Tarifs</a> — détails des plans et fonctionnalités</li>
        <li><a href="/mentions-legales">Mentions légales</a></li>
        <li><a href="/confidentialite">Politique de confidentialité</a></li>
      </ul>
    </LegalLayout>
  );
}
