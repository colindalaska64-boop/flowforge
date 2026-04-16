import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/cleanup
 * Supprime les exécutions de plus de 90 jours.
 * Appelable via cron Vercel (Authorization: Bearer CRON_SECRET)
 * ou manuellement depuis le panel admin.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const result = await pool.query(`
      DELETE FROM executions
      WHERE created_at < NOW() - INTERVAL '90 days'
    `);
    const deleted = result.rowCount ?? 0;

    // Aussi nettoyer les temp_images de plus de 24h
    await pool.query(`
      DELETE FROM temp_images
      WHERE created_at < NOW() - INTERVAL '24 hours'
    `).catch(() => { /* table peut ne pas exister */ });

    return NextResponse.json({
      ok: true,
      deleted_executions: deleted,
      message: `${deleted} exécution(s) supprimée(s).`,
    });
  } catch (err) {
    console.error("[cleanup]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
