import LegalLayout from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Loopflo",
  description: "Mentions légales de Loopflo : éditeur, hébergeur, propriété intellectuelle.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalLayout
      title="Mentions légales"
      subtitle="Informations relatives à l'éditeur et à l'hébergeur du site loopflo.app."
      lastUpdate="26 avril 2026"
    >
      <h2>1. Éditeur du site</h2>
      <p>
        Le site <strong>loopflo.app</strong> (ci-après « le Site ») est édité par :
      </p>
      <span className="placeholder">⚠ À COMPLÉTER : nom complet de l&apos;éditeur (personne physique ou morale), forme juridique, capital social si applicable.</span>
      <p>
        <strong>Nom / Raison sociale :</strong> [Colin Dalaska — entrepreneur individuel]<br />
        <strong>Adresse :</strong> [adresse postale complète]<br />
        <strong>SIRET :</strong> [numéro à 14 chiffres]<br />
        <strong>Numéro de TVA intracommunautaire :</strong> [le cas échéant]<br />
        <strong>Email de contact :</strong> <a href="mailto:loopflo.contact@gmail.com">loopflo.contact@gmail.com</a><br />
        <strong>Directeur de la publication :</strong> Colin Dalaska
      </p>

      <h2>2. Hébergeur</h2>
      <p>
        Le Site est hébergé par <strong>Vercel Inc.</strong>
      </p>
      <p>
        <strong>Adresse :</strong> 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis<br />
        <strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
      </p>
      <p>
        La base de données PostgreSQL est hébergée par <strong>Neon Inc.</strong> (San Francisco, États-Unis), avec
        la région européenne (eu-central-1, Francfort) sélectionnée par défaut pour le stockage des données utilisateurs.
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments composant le Site (textes, images, vidéos, logos, marques, code source,
        bases de données, charte graphique, mascotte, illustrations) sont la propriété exclusive de Loopflo
        et de son éditeur, ou font l&apos;objet d&apos;une licence d&apos;utilisation.
      </p>
      <p>
        Toute reproduction, représentation, modification, publication, transmission, dénaturation, totale ou
        partielle, du Site ou de son contenu, par quelque procédé que ce soit, et sur quelque support que ce
        soit, est interdite sans l&apos;autorisation écrite préalable de l&apos;éditeur. Toute exploitation non
        autorisée du Site ou de son contenu sera considérée comme constitutive d&apos;une contrefaçon et
        poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de propriété
        intellectuelle.
      </p>

      <h2>4. Marque</h2>
      <p>
        La marque « Loopflo » et son logo associé sont protégés. Leur reproduction sans autorisation expresse
        constitue une contrefaçon.
      </p>

      <h2>5. Liens hypertextes</h2>
      <p>
        Le Site peut contenir des liens hypertextes vers d&apos;autres sites internet. Loopflo n&apos;exerce
        aucun contrôle sur ces sites et décline toute responsabilité quant à leurs contenus, politiques de
        confidentialité ou pratiques.
      </p>
      <p>
        L&apos;établissement de liens vers loopflo.app est libre, à condition que cela ne porte pas atteinte
        à l&apos;image de la marque et que la source soit clairement mentionnée.
      </p>

      <h2>6. Responsabilité</h2>
      <p>
        L&apos;éditeur s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations
        diffusées sur le Site, mais ne peut garantir leur exactitude, leur complétude ou leur actualité.
        L&apos;utilisateur reconnaît utiliser ces informations sous sa responsabilité exclusive.
      </p>
      <p>
        Loopflo ne saurait être tenu responsable d&apos;éventuels dysfonctionnements liés au Site, à son
        utilisation ou à la perte de données causée par un cas de force majeure, ni de toute interruption ou
        indisponibilité du service.
      </p>

      <h2>7. Droit applicable et juridiction compétente</h2>
      <p>
        Les présentes mentions légales sont soumises au droit français. En cas de litige, et après échec de
        toute tentative de résolution amiable, les tribunaux français seront seuls compétents.
      </p>

      <h2>8. Médiation de la consommation</h2>
      <p>
        Conformément aux articles L.611-1 et suivants du Code de la consommation, tout consommateur a le
        droit de recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable
        d&apos;un litige avec un professionnel.
      </p>
      <span className="placeholder">⚠ À COMPLÉTER : nom et coordonnées du médiateur agréé une fois sélectionné (CMAP, AME, etc.).</span>

      <h2>9. Contact</h2>
      <p>
        Pour toute question relative aux présentes mentions légales ou au Site, vous pouvez nous contacter à :{" "}
        <a href="mailto:loopflo.contact@gmail.com">loopflo.contact@gmail.com</a>
      </p>
    </LegalLayout>
  );
}
