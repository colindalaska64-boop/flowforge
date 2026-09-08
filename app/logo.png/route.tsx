import { ImageResponse } from "next/og";
import { marqueSvg } from "@/lib/marque";

/**
 * Le logo en PNG, pour les emails.
 *
 * Gmail, Outlook et la plupart des clients refusent d'afficher un SVG dans une
 * balise <img>. L'en-tête des emails a donc besoin d'un vrai bitmap — généré
 * ici à partir du même lib/marque.ts que le reste, pour qu'un changement de
 * logo n'oblige pas à réexporter une image à la main.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

const TAILLE = 256;

export function GET() {
  const svg = marqueSvg({ taille: TAILLE, variante: "blanc", carre: true });
  const source = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: TAILLE, height: TAILLE }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={source} width={TAILLE} height={TAILLE} alt="Loopflo" />
      </div>
    ),
    { width: TAILLE, height: TAILLE }
  );
}
