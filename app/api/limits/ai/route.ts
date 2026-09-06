import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import { getAiUsage, getAiBlockUsage, limiteDuPlan, limiteBlocsIA } from "@/lib/ai-limits";

export const dynamic = "force-dynamic";

/**
 * Consommation IA du mois pour l'utilisateur connecté.
 * Alimente les barres de progression de la page Réglages.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  try {
    const res = await pool.query("SELECT id, plan FROM users WHERE email = $1", [session.user.email]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const { id, plan } = res.rows[0];
    const planNom: string = plan || "free";

    const [kixi, blocs] = await Promise.all([getAiUsage(id), getAiBlockUsage(id)]);

    return NextResponse.json({
      plan: planNom,
      kixi: { used: kixi.used, limit: limiteDuPlan(planNom) },
      blocs: { used: blocs.used, limit: limiteBlocsIA(planNom) },
    });
  } catch (error) {
    console.error("AI LIMITS ERROR:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
