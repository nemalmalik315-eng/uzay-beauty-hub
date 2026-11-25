import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { isAuthenticated, unauthorized } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated(req)) return unauthorized();
  const body = await req.json();
  const db = getDb();
  const fields: string[] = [];
  const args: (string | number | null)[] = [];

  if (body.name !== undefined) { fields.push("name = ?"); args.push(body.name); }
  if (body.collection !== undefined) { fields.push("collection = ?"); args.push(body.collection); }
  if (body.service_ids !== undefined) { fields.push("service_ids = ?"); args.push(JSON.stringify(body.service_ids)); }
  if (body.discount_percent !== undefined) { fields.push("discount_percent = ?"); args.push(body.discount_percent); }
  if (body.custom_price !== undefined) { fields.push("custom_price = ?"); args.push(body.custom_price); }
  if (body.active !== undefined) { fields.push("active = ?"); args.push(body.active ? 1 : 0); }

  if (!fields.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  args.push(Number(params.id));
  await db.execute({ sql: `UPDATE deals SET ${fields.join(", ")} WHERE id = ?`, args });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthenticated(req)) return unauthorized();
  const db = getDb();
  await db.execute({ sql: "DELETE FROM deals WHERE id = ?", args: [Number(params.id)] });
  return NextResponse.json({ ok: true });
}
