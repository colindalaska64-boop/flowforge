import LegalLayout from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos — Loopflo",
  description: "L'histoire, la mission et l'équipe derrière Loopflo, l'automatisation no-code française.",
};

export default function AProposPage() {
  return (
    <LegalLayout
      title="À propos de Loopflo"
      subtitle="L'automatisation, sans coder. Une histoire née d'un constat simple."
    >
      <h2>Notre mission</h2>
      <p>
        Loopflo veut rendre l&apos;automatisation accessible à tout le monde, pas seulement aux
        développeurs ou aux équipes techniques. Si tu peux décrire ce que tu veux automatiser en français
        courant, tu peux le faire fonctionner en moins de deux minutes — sans écrire une ligne de code.
      </p>

      <h2>Pourquoi Loopflo existe</h2>
      <p>
        Les outils d&apos;automatisation existants (Make, Zapier, n8n) sont puissants mais souvent :
      </p>
      <ul>
        <li>Trop complexes pour les non-développeurs</li>
        <li>Pas pensés en français</li>
        <li>Chers dès qu&apos;on dépasse l&apos;usage personnel</li>
        <li>Limités par leur logique « si X alors Y » sans vraie intelligence</li>
      </ul>
      <p>
        Loopflo prend le contre-pied : on parle français, l&apos;IA aide à construire le workflow plutôt
        que de juste l&apos;exécuter, et les blocs sont composites (un bloc « Notification multi-canal »
        au lieu de chaîner Slack + Discord + Telegram à la main).
      </p>

      <h2>Ce qui nous distingue</h2>
      <h3>Kixi, l&apos;assistant IA intégré</h3>
      <p>
        Décris ton automatisation en français comme tu l&apos;expliquerais à un collègue : « Quand je
        reçois un email avec une facture, extrais le montant et la date, puis envoie-moi un récap sur
        Slack. » Kixi génère le workflow complet en quelques secondes.
      </p>

      <h3>Des blocs composites pensés français</h3>
      <p>
        Plutôt que d&apos;empiler 5 blocs techniques pour faire une chose simple, Loopflo propose des
        blocs « tout-en-un » : <strong>Réponse auto IA</strong>, <strong>Notification multi-canal</strong>,
        <strong>Vidéo virale courte</strong>… Tu configures une fois, ça marche.
      </p>

      <h3>L&apos;IA, vraiment intégrée</h3>
      <p>
        On ne se contente pas de proposer un bloc « ChatGPT ». L&apos;IA filtre tes données, extrait des
        informations structurées, génère du texte, des images, des voix — directement dans tes workflows.
      </p>

      <h3>Plan gratuit généreux, sans piège</h3>
      <p>
        Le plan gratuit est pensé pour être réellement utilisable au quotidien — pas une démo de 14 jours.
        Tu peux faire tourner tes premières automatisations sans carte bancaire et sans limite de temps.
      </p>

      <h2>L&apos;équipe</h2>
      <p>
        Loopflo est porté par <strong>Colin Dalaska</strong>, développeur autodidacte basé en France. Le
        projet a démarré comme un side-project pour automatiser ses propres workflows, et a grandi à
        partir des retours des premiers utilisateurs.
      </p>
      <p>
        On reste volontairement petit pour pouvoir lire et répondre à chaque message des utilisateurs.
        Si tu nous écris, c&apos;est <em>nous</em> qui te répondons — pas un bot, pas un service externalisé.
      </p>

      <h2>Notre stack technique</h2>
      <p>
        Pour les curieux : Loopflo tourne sur <strong>Next.js 15</strong>, <strong>PostgreSQL</strong>{" "}
        (Neon, région UE), <strong>Vercel</strong> pour l&apos;hébergement, <strong>Stripe</strong> pour
        les paiements et <strong>Groq</strong> (Llama 3.3 70B) pour l&apos;IA. La sécurité est prise au
        sérieux : tokens chiffrés AES-256-GCM, protection SSRF, audit trail admin, rate limiting,
        verrouillage des comptes après 5 tentatives.
      </p>

      <h2>La feuille de route</h2>
      <p>
        Loopflo évolue chaque semaine selon les retours utilisateurs. Les chantiers en cours :
      </p>
      <ul>
        <li>Élargir le catalogue d&apos;intégrations (TikTok Direct Post, YouTube upload, Pinterest…)</li>
        <li>Mode collaboratif (workflows partagés en équipe)</li>
        <li>Marketplace de templates créés par la communauté</li>
        <li>Auto-complétion des variables <code>{`{{...}}`}</code> dans l&apos;éditeur</li>
        <li>Mode mobile complet</li>
      </ul>
      <p>
        Si tu as une idée, écris-nous : <a href="/contact">page contact</a>.
      </p>

      <h2>Rejoindre l&apos;aventure</h2>
      <p>
        On cherche des bêta-testeurs passionnés et des templates créateurs pour la marketplace. Si tu veux
        participer :{" "}
        <a href="mailto:loopflo.contact@gmail.com?subject=Beta">loopflo.contact@gmail.com</a>.
      </p>

      <p style={{ marginTop: "2.5rem", fontStyle: "italic", color: "#6B7280" }}>
        Merci de faire partie des premiers à utiliser Loopflo. Ton feedback façonne ce qu&apos;on construit.
      </p>
    </LegalLayout>
  );
}
