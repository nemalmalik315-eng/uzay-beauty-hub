import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

async function ensureTable() {
  const db = getDb();
  await db.execute(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    expense_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
}

export async function GET(req: NextRequest) {
  await ensureTable();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  let sql = "SELECT * FROM expenses";
  const args: (string | number)[] = [];

  if (month) {
    sql += " WHERE strftime('%Y-%m', expense_date) = ?";
    args.push(month);
  } else {
    sql += " WHERE strftime('%Y-%m', expense_date) = strftime('%Y-%m', 'now')";
  }

  sql += " ORDER BY expense_date DESC, id DESC";

  const { rows } = await db.execute({ sql, args });
  const total = (rows as Array<{ amount: number }>).reduce((s, r) => s + Number(r.amount), 0);
  return NextResponse.json({ expenses: rows, total });
}

export async function POST(req: NextRequest) {
  await ensureTable();
  const db = getDb();
  const { category, description, amount, expense_date } = await req.json();
  if (!category || !amount || !expense_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const result = await db.execute({
    sql: "INSERT INTO expenses (category, description, amount, expense_date) VALUES (?, ?, ?, ?)",
    args: [category, description || null, Number(amount), expense_date],
  });
  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}

export async function PATCH(req: NextRequest) {
  await ensureTable();
  const db = getDb();
  const { id, category, description, amount, expense_date } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.execute({
    sql: "UPDATE expenses SET category = ?, description = ?, amount = ?, expense_date = ? WHERE id = ?",
    args: [category, description || null, Number(amount), expense_date, Number(id)],
  });
  return NextResponse.json({ id: Number(id) });
}

export async function DELETE(req: NextRequest) {
  await ensureTable();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.execute({ sql: "DELETE FROM expenses WHERE id = ?", args: [Number(id)] });
  return NextResponse.json({ message: "Deleted" });
}
