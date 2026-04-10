import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return new NextResponse("Not found", { status: 404 });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS temp_images (
        id TEXT PRIMARY KEY,
        data BYTEA NOT NULL,
        mime TEXT NOT NULL DEFAULT 'image/png',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const result = await pool.query(
      "SELECT data, mime FROM temp_images WHERE id = $1",
      [id]
    );
    if (!result.rows[0]) return new NextResponse("Not found", { status: 404 });

    const { data, mime } = result.rows[0];
    return new NextResponse(data, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
