import { ImageResponse } from "next/og";
import { marqueSvg } from "@/lib/marque";
import { DOMAINE } from "@/lib/site";

/**
 * L'image de partage — l'aperçu affiché quand un lien Loopflo est collé sur
 * LinkedIn, X, WhatsApp, Slack ou Discord.
 *
 * Elle était référencée partout (layout, /vs-make, /vs-zapier,
 * /automatisation-workflow, les données structurées) mais n'existait pas :
 * /og-image.png répondait 404. Tous les partages sortaient donc sans visuel,
 * et le logo déclaré à Google dans le JSON-LD pointait dans le vide.
 *
 * Elle est générée depuis lib/marque.ts, comme le favicon : changer de logo la
 * met à jour, sans réexport manuel.
 */
export const dynamic = "force-static";
export const revalidate = 86400;

// Format attendu par les réseaux sociaux.
const LARGEUR = 1200;
const HAUTEUR = 630;

export function GET() {
  const marque = marqueSvg({ taille: 150, variante: "blanc", carre: true });
  const source = `data:image/svg+xml;base64,${Buffer.from(marque).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: LARGEUR,
          height: HAUTEUR,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0F0A2E 0%, #241a5c 55%, #4F46E5 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 44 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={source} width={150} height={150} alt="" />
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800, letterSpacing: "-0.04em" }}>
            <span style={{ color: "#FFFFFF" }}>Loop</span>
            <span style={{ color: "#A5B4FC" }}>flo</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 44,
            color: "#FFFFFF",
            fontWeight: 600,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          Automatisez tout, sans une ligne de code
        </div>

        <div style={{ display: "flex", fontSize: 28, color: "#A5B4FC", marginTop: 28 }}>
          {DOMAINE}
        </div>
      </div>
    ),
    { width: LARGEUR, height: HAUTEUR }
  );
}
