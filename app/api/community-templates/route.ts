/**
 * GET  /api/community-templates  — liste avec pagination, recherche, filtre catégorie
 * POST /api/community-templates  — publier un template (auth requise)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import pool from "@/lib/db";
import { sanitizeWorkflowForTemplate } from "@/lib/templateSanitizer";
import { validateTemplate, TEMPLATE_CATEGORIES } from "@/lib/templateValidator";
import { rateLimit } from "@/lib/ratelimit";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET — liste publique (pas besoin d'être connecté)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q         = searchParams.get("q")?.trim().slice(0, 100) || "";
    const category  = searchParams.get("category") || "";
    const sort      = searchParams.get("sort") || "recent"; // recent | popular | downloads
    const page      = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit     = 24;
    const offset    = (page - 1) * limit;

    const conditions: string[] = ["ct.status = 'published'"];
    const values: unknown[] = [];
    let idx = 1;

    if (q) {
      conditions.push(
        `to_tsvector('simple', ct.name || ' ' || ct.description) @@ plainto_tsquery('simple', $${idx})`
      );
      values.push(q);
      idx++;
    }

    if (category && TEMPLATE_CATEGORIES.includes(category as never)) {
      conditions.push(`ct.category = $${idx}`);
      values.push(category);
      idx++;
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const orderBy = sort === "popular"
      ? "ORDER BY ct.likes DESC, ct.created_at DESC"
      : sort === "downloads"
      ? "ORDER BY ct.downloads DESC, ct.created_at DESC"
      : "ORDER BY ct.created_at DESC";

    const [rows, countRow] = await Promise.all([
      pool.query(
        `SELECT ct.id, ct.user_name, ct.name, ct.description, ct.category,
                ct.keywords, ct.tools, ct.config_time, ct.configurable_blocks,
                ct.downloads, ct.likes, ct.share_token, ct.created_at
         FROM community_templates ct
         ${where}
         ${orderBy}
         LIMIT ${limit} OFFSET ${offset}`,
        values
      ),
      pool.query(
        `SELECT COUNT(*) FROM community_templates ct ${where}`,
        values
      ),
    ]);

    return NextResponse.json({
      templates: rows.rows,
      total: parseInt(countRow.rows[0].count),
      page,
      pages: Math.ceil(parseInt(countRow.rows[0].count) / limit),
    });
  } catch (error) {
    console.error("GET community-templates:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — publier un template
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    // Rate limit : 3 publications par heure par utilisateur
    const rl = rateLimit(`publish:${session.user.email}`, 3, 60 * 60 * 1000);
    if (!rl.allowed)
      return NextResponse.json(
        { error: `Trop de publications. Réessayez dans ${rl.retryAfter} secondes.` },
        { status: 429 }
      );

    const body = await req.json();
    const { name, description, category, keywords, configTime, workflowData, configurableBlocks } = body;

    // Validation
    const validation = validateTemplate({
      name, description, category,
      keywords: keywords || [],
      workflowData,
      configurableBlocks,
    });
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

    // Récupère l'utilisateur
    const userRow = await pool.query(
      "SELECT id, name FROM users WHERE email = $1",
      [session.user.email]
    );
    if (!userRow.rows.length)
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    const { id: userId, name: userName } = userRow.rows[0];

    // Limite 10 templates par user
    const countRow = await pool.query(
      "SELECT COUNT(*) FROM community_templates WHERE user_id = $1 AND status != 'deleted'",
      [userId]
    );
    if (parseInt(countRow.rows[0].count) >= 10)
      return NextResponse.json(
        { error: "Limite de 10 templates publiés atteinte. Supprimez-en un pour continuer." },
        { status: 429 }
      );

    // Sanitize le workflow (vide credentials + champs configurables)
    const sanitizedWorkflow = sanitizeWorkflowForTemplate(workflowData, configurableBlocks || []);

    // Extrait les tools depuis les nodes
    const tools: string[] = [...new Set(
      (sanitizedWorkflow.nodes || [])
        .map((n: { data?: { label?: string } }) => n.data?.label || "")
        .filter(Boolean)
    )].slice(0, 15);

    const shareToken = crypto.randomBytes(12).toString("hex");

    const result = await pool.query(
      `INSERT INTO community_templates
         (user_id, user_name, name, description, category, keywords, tools,
          config_time, workflow_data, configurable_blocks, status, share_token)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'published',$11)
       RETURNING id, name, category, downloads, likes, share_token, created_at`,
      [
        userId,
        userName || session.user.name || "Utilisateur",
        name.trim(),
        description.trim(),
        category,
        keywords || [],
        tools,
        Math.max(1, Math.min(60, parseInt(configTime) || 5)),
        JSON.stringify(sanitizedWorkflow),
        JSON.stringify(configurableBlocks || []),
        shareToken,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("POST community-templates:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — supprimer son propre template
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID manquant." }, { status: 400 });

    const userRow = await pool.query("SELECT id FROM users WHERE email = $1", [session.user.email]);
    if (!userRow.rows.length) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

    const result = await pool.query(
      "DELETE FROM community_templates WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userRow.rows[0].id]
    );
    if (!result.rows.length)
      return NextResponse.json({ error: "Template introuvable ou non autorisé." }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE community-templates:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
