import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { ensureStaffTables } from "@/lib/ensure-staff-tables";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureStaffTables();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all");

  const query = all === "true"
    ? "SELECT * FROM employees ORDER BY active DESC, name ASC"
    : "SELECT * FROM employees WHERE active = 1 ORDER BY name ASC";

  const { rows } = await db.execute(query);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await ensureStaffTables();
  const db = getDb();
  const body = await req.json();
  const { name, phone, role = "Stylist", shift_start = "11:00" } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
  }

  const result = await db.execute({
    sql: "INSERT INTO employees (name, phone, role, shift_start) VALUES (?, ?, ?, ?)",
    args: [name, phone, role, shift_start],
  });

  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}

export async function PATCH(req: NextRequest) {
  await ensureStaffTables();
  const db = getDb();
  const body = await req.json();
  const { id, name, phone, role, shift_start, active } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const sets: string[] = [];
  const args: (string | number | null)[] = [];

  if (name !== undefined) { sets.push("name = ?"); args.push(name); }
  if (phone !== undefined) { sets.push("phone = ?"); args.push(phone); }
  if (role !== undefined) { sets.push("role = ?"); args.push(role); }
  if (shift_start !== undefined) { sets.push("shift_start = ?"); args.push(shift_start); }
  if (active !== undefined) { sets.push("active = ?"); args.push(active); }

  if (sets.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  args.push(id);
  await db.execute({ sql: `UPDATE employees SET ${sets.join(", ")} WHERE id = ?`, args });
  return NextResponse.json({ message: "Employee updated" });
}
