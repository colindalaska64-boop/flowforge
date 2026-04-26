import LegalLayout from "@/components/LegalLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Loopflo",
  description: "Réponses aux questions les plus fréquentes sur Loopflo.",
};

export default function FAQPage() {
  return (
    <LegalLayout
      title="Questions fréquentes"
      subtitle="Tout ce que tu te demandes (probablement) sur Loopflo."
    >
      <h2>Démarrer</h2>

      <h3>C&apos;est quoi Loopflo, exactement ?</h3>
      <p>
        Loopflo est une plateforme d&apos;automatisation no-code en français. Tu connectes des services
        (Gmail, Slack, Notion, Stripe…) et tu crées des workflows qui s&apos;exécutent automatiquement
        sans intervention. Comme Make ou Zapier, mais avec une vraie IA française qui peut générer le
        workflow pour toi.
      </p>

      <h3>Faut-il savoir coder ?</h3>
      <p>
        Non, jamais. Tu glisses des blocs visuels dans l&apos;éditeur, ou tu décris ce que tu veux faire
        à Kixi (l&apos;IA intégrée) qui génère le workflow tout seul.
      </p>

      <h3>Comment je commence ?</h3>
      <p>
        Crée un compte gratuit en 30 secondes (juste un email + mot de passe), connecte un service tiers
        depuis <code>Paramètres &gt; Connexions</code>, puis crée ton premier workflow depuis le dashboard.
        Tu peux aussi importer un template existant pour démarrer vite.
      </p>

      <hr />

      <h2>Plans et tarifs</h2>

      <h3>Le plan gratuit est-il vraiment gratuit ?</h3>
      <p>
        Oui, et sans limite de temps. Pas de carte bancaire requise. Le plan gratuit suffit largement pour
        des usages personnels (quelques workflows, quelques centaines d&apos;exécutions par mois).
      </p>

      <h3>Quand devrais-je passer au plan payant ?</h3>
      <p>
        Quand tu as besoin de plus d&apos;exécutions, plus de workflows actifs, ou des blocs IA illimités
        (texte, image, voix). Le plan Starter convient à un usage individuel intensif, le plan Pro pour
        un usage professionnel.
      </p>

      <h3>Je peux annuler à tout moment ?</h3>
      <p>
        Oui, sans justification, depuis tes paramètres. La résiliation prend effet à la fin de la période
        en cours (mensuelle ou annuelle).
      </p>

      <h3>Est-ce que mes données sont bloquées si j&apos;arrête de payer ?</h3>
      <p>
        Non. Tu peux exporter tous tes workflows et données en JSON à tout moment, même après avoir
        annulé. Si tu repasses au plan gratuit, tes workflows restent accessibles dans la limite des
        quotas du plan gratuit.
      </p>

      <hr />

      <h2>Sécurité et données</h2>

      <h3>Où sont stockées mes données ?</h3>
      <p>
        Sur des serveurs PostgreSQL hébergés par Neon, en région européenne (Francfort, Allemagne).
        L&apos;application tourne sur Vercel. Toutes les communications sont en HTTPS (TLS 1.3).
      </p>

      <h3>Mes clés API et tokens sont-ils en sécurité ?</h3>
      <p>
        Oui. Toutes les clés sensibles (tokens OAuth, clés API tierces) sont chiffrées en base avec
        AES-256-GCM avant stockage. Les mots de passe sont hashés avec bcrypt (cost factor 12). Loopflo
        ne stocke aucune donnée bancaire (Stripe gère ça à notre place).
      </p>

      <h3>Vous lisez le contenu de mes emails et workflows ?</h3>
      <p>
        Non. Loopflo n&apos;accède jamais manuellement à tes données. Les seules occasions où elles sont
        traitées sont :
      </p>
      <ul>
        <li>Pendant l&apos;exécution d&apos;un workflow (automatique, pas d&apos;humain dans la boucle)</li>
        <li>Quand tu utilises un bloc IA — la donnée est envoyée à Groq pour le traitement, et n&apos;est jamais conservée par Groq au-delà de la requête</li>
        <li>En cas de demande de support explicite de ta part</li>
      </ul>

      <h3>Comment supprimer mon compte et toutes mes données ?</h3>
      <p>
        Dans <code>Paramètres &gt; Mes données &gt; Supprimer mon compte</code>. Toutes tes données
        (workflows, exécutions, connexions) sont effacées dans les 30 jours.
      </p>

      <hr />

      <h2>Workflows et limites</h2>

      <h3>Combien de workflows je peux créer ?</h3>
      <p>
        Pas de limite de création. Mais le nombre de workflows <strong>actifs</strong> (qui peuvent
        s&apos;exécuter) dépend de ton plan. Tu peux toujours désactiver un workflow et en activer un
        autre, sans perdre les données.
      </p>

      <h3>Combien d&apos;exécutions par mois ?</h3>
      <p>
        Plan gratuit : 200 exécutions / mois. Starter : 2 000. Pro : 20 000. Business : illimité. Détails
        sur la <a href="/pricing">page Tarifs</a>.
      </p>

      <h3>Une exécution, c&apos;est quoi exactement ?</h3>
      <p>
        Une exécution = un déclenchement de workflow. Si ton workflow contient 5 blocs et qu&apos;ils
        s&apos;exécutent tous, ça compte pour 1 exécution. Pas pour 5.
      </p>

      <h3>Les workflows tournent même quand je suis déconnecté ?</h3>
      <p>
        Oui. Une fois activé, un workflow tourne 24/7 sur nos serveurs. Tu peux fermer ton ordinateur,
        ça continue.
      </p>

      <hr />

      <h2>Intégrations</h2>

      <h3>Quels services je peux connecter ?</h3>
      <p>
        Loopflo supporte aujourd&apos;hui : Gmail, Google Sheets, Google Drive, Google Calendar, Slack,
        Discord, Telegram, Notion, Airtable, HubSpot, Stripe, GitHub, Twitter/X, LinkedIn, Instagram,
        YouTube, TikTok, Threads, Pinterest, Reddit, ElevenLabs, Stability AI, Runway, HeyGen, Suno,
        Twilio (SMS, WhatsApp), et bien sûr les requêtes HTTP custom pour tout le reste.
      </p>

      <h3>Mon service préféré n&apos;est pas dans la liste ?</h3>
      <p>
        Tu peux utiliser le bloc <strong>HTTP Request</strong> pour appeler n&apos;importe quelle API.
        Ou nous demander d&apos;ajouter une intégration dédiée via le bouton « Suggestion » dans
        l&apos;éditeur de workflow.
      </p>

      <h3>Comment connecter un service ?</h3>
      <p>
        Pour Google : connexion OAuth en un clic. Pour les autres : tu colles ta clé API ou ton token
        (généré dans les paramètres du service tiers) dans <code>Paramètres &gt; Connexions</code>.
      </p>

      <hr />

      <h2>L&apos;IA dans Loopflo</h2>

      <h3>Quel modèle d&apos;IA est utilisé ?</h3>
      <p>
        Le modèle principal est <strong>Llama 3.3 70B</strong> via <strong>Groq</strong> (le plus rapide
        au monde). Pour les images : Stability AI (région UE) ou Gemini Imagen. Pour la voix : ElevenLabs.
      </p>

      <h3>Mes prompts sont-ils utilisés pour entraîner l&apos;IA ?</h3>
      <p>
        Non. Groq ne conserve pas les requêtes au-delà du temps nécessaire au traitement, et ne les
        utilise pas pour entraîner ses modèles, conformément à leurs CGU.
      </p>

      <h3>Pourquoi Kixi me pose des questions parfois ?</h3>
      <p>
        Kixi est conçu pour générer un workflow dès qu&apos;il a assez d&apos;infos. Il ne te pose une
        question que s&apos;il manque une info <em>vraiment critique</em> pour bien faire le workflow.
        Tu peux toujours répondre « va-y » ou « génère » pour l&apos;obliger à se lancer avec des valeurs
        par défaut.
      </p>

      <hr />

      <h2>Bugs et support</h2>

      <h3>Mon workflow plante, comment savoir pourquoi ?</h3>
      <p>
        Va dans <code>Dashboard &gt; Historique</code>. Tu vois toutes les exécutions, leur statut, et
        l&apos;erreur précise pour chaque bloc qui a échoué. Tu peux aussi cliquer sur « Expliquer avec
        l&apos;IA » sur une erreur pour avoir une explication en langage simple.
      </p>

      <h3>Comment signaler un bug ?</h3>
      <p>
        Email à <a href="mailto:loopflo.contact@gmail.com?subject=Bug%20Loopflo">loopflo.contact@gmail.com</a>.
        Décris ce que tu faisais, le résultat obtenu, et ajoute si possible une capture. Réponse en moins
        de 24h ouvrées.
      </p>

      <h3>Vous garantissez le service à 100% ?</h3>
      <p>
        On vise 99,9% de disponibilité, mais on ne peut pas garantir 100% (Vercel ou Neon peuvent avoir
        une panne). Le plan Business inclut un SLA contractuel.
      </p>

      <hr />

      <h2>Questions diverses</h2>

      <h3>Loopflo est-il open-source ?</h3>
      <p>
        Pour l&apos;instant non. C&apos;est en réflexion pour les blocs et l&apos;exécuteur dans le futur.
      </p>

      <h3>Vous avez une app mobile ?</h3>
      <p>
        Pas encore. Le dashboard est responsive et utilisable sur mobile, mais une app native est dans la
        roadmap.
      </p>

      <h3>Je peux revendre Loopflo en marque blanche ?</h3>
      <p>
        Pas dans la version standard. Pour des solutions enterprise/white-label, contacte-nous :{" "}
        <a href="mailto:loopflo.contact@gmail.com?subject=Enterprise">loopflo.contact@gmail.com</a>.
      </p>

      <h3>Une question qui n&apos;est pas dans cette FAQ ?</h3>
      <p>
        Écris-nous : <a href="/contact">page contact</a>. On lit tout, on répond vite.
      </p>
    </LegalLayout>
  );
}
