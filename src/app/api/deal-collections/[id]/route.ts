import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { isAuthenticated, unauthorized } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated(req)) return unauthorized();
  const { name, color, start_date, end_date } = await req.json();
  const db = getDb();
  const fields: string[] = [];
  const args: (string | null)[] = [];
  if (name !== undefined) { fields.push("name = ?"); args.push(name); }
  if (color !== undefined) { fields.push("color = ?"); args.push(color); }
  if (start_date !== undefined) { fields.push("start_date = ?"); args.push(start_date ?? null); }
  if (end_date !== undefined) { fields.push("end_date = ?"); args.push(end_date ?? null); }
  if (!fields.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  args.push(params.id);
  await db.execute({ sql: `UPDATE deal_collections SET ${fields.join(", ")} WHERE id = ?`, args });
  // Also rename deals if name changed
  if (name !== undefined) {
    const { rows } = await db.execute({ sql: "SELECT name FROM deal_collections WHERE id = ?", args: [params.id] });
    if (rows.length) {
      await db.execute({ sql: "UPDATE deals SET collection = ? WHERE collection = ?", args: [name, String(rows[0].name)] });
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated(req)) return unauthorized();
  const db = getDb();
  const { rows } = await db.execute({ sql: "SELECT name FROM deal_collections WHERE id = ?", args: [Number(params.id)] });
  if (rows.length) {
    await db.execute({ sql: "DELETE FROM deals WHERE collection = ?", args: [String(rows[0].name)] });
  }
  await db.execute({ sql: "DELETE FROM deal_collections WHERE id = ?", args: [Number(params.id)] });
  return NextResponse.json({ ok: true });
}
