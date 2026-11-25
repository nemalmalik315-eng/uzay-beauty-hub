import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { isAuthenticated, unauthorized } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const db = getDb();
  const { rows } = await db.execute("SELECT * FROM deal_collections ORDER BY name");
  return NextResponse.json(rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    color: String(r.color ?? "#C9A84C"),
    start_date: r.start_date ? String(r.start_date) : null,
    end_date: r.end_date ? String(r.end_date) : null,
  })));
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const { name, color, start_date, end_date } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  const db = getDb();
  await db.execute({
    sql: "INSERT OR IGNORE INTO deal_collections (name, color, start_date, end_date) VALUES (?, ?, ?, ?)",
    args: [name.trim(), color ?? "#C9A84C", start_date ?? null, end_date ?? null],
  });
  return NextResponse.json({ ok: true });
}
