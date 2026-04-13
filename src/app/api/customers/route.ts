import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  let query = "SELECT * FROM customers";
  const params: string[] = [];

  if (search) {
    query += " WHERE name LIKE ? OR phone LIKE ?";
    params.push(`%${search}%`, `%${search}%`);
  }
  query += " ORDER BY created_at DESC";

  const customers = db.prepare(query).all(...params);
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { name, phone, email } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
  }

  const result = db
    .prepare("INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)")
    .run(name, phone, email || null);

  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}
