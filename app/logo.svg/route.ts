import { marqueSvg } from "@/lib/marque";

/**
 * Le favicon, servi depuis lib/marque.ts.
 *
 * Un fichier app/icon.svg statique aurait obligé à redessiner le logo à la main
 * à chaque changement — c'est exactement ce qu'on veut éviter. La route le
 * génère, donc modifier lib/marque.ts met le favicon à jour tout seul.
 *
 * La marque est posée sur la pastille indigo : dans un onglet, un trait sans
 * fond disparaît sur les thèmes clairs comme sombres.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  return new Response(marqueSvg({ variante: "blanc", carre: true }), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
