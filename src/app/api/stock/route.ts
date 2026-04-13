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

  const items = db.prepare(query).all();

  const lowStockCount = (
    db.prepare("SELECT COUNT(*) as count FROM stock WHERE quantity <= min_threshold").get() as { count: number }
  ).count;

  return NextResponse.json({ items, lowStockCount });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { product_name, category, quantity, min_threshold = 5, unit_price = 0 } = body;

  if (!product_name || !category) {
    return NextResponse.json({ error: "Product name and category required" }, { status: 400 });
  }

  const result = db
    .prepare(
      "INSERT INTO stock (product_name, category, quantity, min_threshold, unit_price, last_restocked) VALUES (?, ?, ?, ?, ?, datetime('now'))"
    )
    .run(product_name, category, quantity || 0, min_threshold, unit_price);

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
    db.prepare("UPDATE stock SET quantity = ?, last_restocked = datetime('now') WHERE id = ?").run(
      quantity,
      id
    );
  }
  if (product_name) {
    db.prepare("UPDATE stock SET product_name = ? WHERE id = ?").run(product_name, id);
  }
  if (category) {
    db.prepare("UPDATE stock SET category = ? WHERE id = ?").run(category, id);
  }
  if (min_threshold !== undefined) {
    db.prepare("UPDATE stock SET min_threshold = ? WHERE id = ?").run(min_threshold, id);
  }
  if (unit_price !== undefined) {
    db.prepare("UPDATE stock SET unit_price = ? WHERE id = ?").run(unit_price, id);
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

  db.prepare("DELETE FROM stock WHERE id = ?").run(id);
  return NextResponse.json({ message: "Stock deleted" });
}
