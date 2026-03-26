import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query('SELECT id, email FROM users LIMIT 3');
    return NextResponse.json({ ok: true, users: result.rows, db: process.env.DATABASE_URL?.slice(0, 40) });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
