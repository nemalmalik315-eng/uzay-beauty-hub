import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const lowStock = searchParams.get("low_stock");

  let query = "SELECT * FROM stock";
  if (lowStock === "true") {
    query += " WHERE quantity <= min_threshold";
  }
  query += " ORDER BY category, product_name";

  const { rows: items } = await db.execute(query);

  const { rows: countRows } = await db.execute(
    "SELECT COUNT(*) as count FROM stock WHERE quantity <= min_threshold"
  );
  const lowStockCount = Number(countRows[0].count);

  return NextResponse.json({ items, lowStockCount });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { product_name, category, quantity, min_threshold = 5, unit_price = 0 } = body;

  if (!product_name || !category) {
    return NextResponse.json({ error: "Product name and category required" }, { status: 400 });
  }

  const result = await db.execute({
    sql: "INSERT INTO stock (product_name, category, quantity, min_threshold, unit_price, last_restocked) VALUES (?, ?, ?, ?, ?, datetime('now'))",
    args: [product_name, category, quantity || 0, min_threshold, unit_price],
  });

  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { id, quantity, product_name, category, min_threshold, unit_price } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (quantity !== undefined) {
    await db.execute({
      sql: "UPDATE stock SET quantity = ?, last_restocked = datetime('now') WHERE id = ?",
      args: [quantity, id],
    });
  }
  if (product_name) {
    await db.execute({ sql: "UPDATE stock SET product_name = ? WHERE id = ?", args: [product_name, id] });
  }
  if (category) {
    await db.execute({ sql: "UPDATE stock SET category = ? WHERE id = ?", args: [category, id] });
  }
  if (min_threshold !== undefined) {
    await db.execute({ sql: "UPDATE stock SET min_threshold = ? WHERE id = ?", args: [min_threshold, id] });
  }
  if (unit_price !== undefined) {
    await db.execute({ sql: "UPDATE stock SET unit_price = ? WHERE id = ?", args: [unit_price, id] });
  }

  return NextResponse.json({ message: "Stock updated" });
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await db.execute({ sql: "DELETE FROM stock WHERE id = ?", args: [id] });
  return NextResponse.json({ message: "Stock deleted" });
}
