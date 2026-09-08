import { MetadataRoute } from "next";

/** Zones privées : jamais indexées, quel que soit le robot. */
const PRIVE = ["/dashboard/", "/admin/", "/api/"];

/**
 * Robots des moteurs de réponse (mode IA de Google, ChatGPT, Claude,
 * Perplexity…). Ils sont autorisés explicitement : sans cela, certains
 * s'abstiennent par défaut, et Loopflo n'apparaît jamais dans les réponses
 * générées. La fiche /ia et /llms.txt sont écrites pour eux.
 */
const ROBOTS_IA = [
  "Google-Extended", // alimente Gemini et le mode IA de Google
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "meta-externalagent",
  "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /dev : documentation interne de l'équipe, ne doit pas remonter dans les résultats
        disallow: [...PRIVE, "/dev"],
      },
      ...ROBOTS_IA.map(userAgent => ({
        userAgent,
        allow: ["/", "/ia", "/llms.txt"],
        disallow: [...PRIVE, "/dev"],
      })),
    ],
    sitemap: "https://loopflo.app/sitemap.xml",
    host: "https://loopflo.app",
  };
}
