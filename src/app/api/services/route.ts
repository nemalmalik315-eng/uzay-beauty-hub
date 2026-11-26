import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { isAuthenticated, unauthorized } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  if (all) {
    if (!isAuthenticated(req)) return unauthorized();
    const { rows } = await db.execute(
      "SELECT * FROM services ORDER BY category, sort_order, id"
    );
    return NextResponse.json(rows);
  }

  const now = new Date();
  const afterOctober2026 = now > new Date("2026-10-31T23:59:59");
  const { rows } = await db.execute(
    afterOctober2026
      ? "SELECT * FROM services WHERE active = 1 AND category != 'October Deals' ORDER BY category, sort_order, id"
      : "SELECT * FROM services WHERE active = 1 ORDER BY category, sort_order, id"
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const db = getDb();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, category, price, price_max, duration, description } = body as {
    name?: string; category?: string; price?: number; price_max?: number | null;
    duration?: number | null; description?: string | null;
  };

  if (!name || !category || price === undefined) {
    return NextResponse.json({ error: "Name, category, and price are required" }, { status: 400 });
  }

  const result = await db.execute({
    sql: "INSERT INTO services (name, category, price, price_max, duration, description, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, 1, 0)",
    args: [name, category, price, price_max ?? null, duration ?? null, description ?? null],
  });

  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const db = getDb();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const allowed = ["name", "category", "price", "price_max", "duration", "description", "active", "sort_order"];
  const fields = Object.keys(updates).filter((k) => allowed.includes(k));

  if (fields.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const setClauses = fields.map((f) => `${f} = ?`).join(", ");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const args = [...fields.map((f) => updates[f] as any), id];

  await db.execute({
    sql: `UPDATE services SET ${setClauses} WHERE id = ?`,
    args,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await db.execute({ sql: "DELETE FROM services WHERE id = ?", args: [Number(id)] });
  return NextResponse.json({ success: true });
}
