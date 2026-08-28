import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

let customerColsEnsured = false;
async function ensureCustomerColumns() {
  if (customerColsEnsured) return;
  const db = getDb();
  for (const col of ["surname TEXT", "house_no TEXT", "society TEXT", "notes TEXT"]) {
    try { await db.execute({ sql: `ALTER TABLE customers ADD COLUMN ${col}`, args: [] }); } catch { /* already exists */ }
  }
  customerColsEnsured = true;
}

export async function GET(req: NextRequest) {
  await ensureCustomerColumns();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "newest";

  const whereClause = search ? "WHERE (c.name LIKE ? OR c.phone LIKE ?)" : "";
  const params: string[] = search ? [`%${search}%`, `%${search}%`] : [];

  const orderMap: Record<string, string> = {
    newest: "c.created_at DESC",
    oldest: "c.created_at ASC",
    highest_spend: "total_spent DESC",
    lowest_spend: "total_spent ASC",
    most_visits: "visit_count DESC",
    least_visits: "visit_count ASC",
    recent_visit: "last_visit DESC NULLS LAST",
  };
  const orderBy = orderMap[sort] ?? "c.created_at DESC";

  const query = `
    SELECT c.*,
      COALESCE(SUM(b.total), 0) as total_spent,
      COUNT(b.id) as visit_count,
      MAX(DATE(b.created_at)) as last_visit
    FROM customers c
    LEFT JOIN billing b ON b.customer_id = c.id
    ${whereClause}
    GROUP BY c.id
    ORDER BY ${orderBy}
  `;

  const { rows } = await db.execute({ sql: query, args: params });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await ensureCustomerColumns();
  const db = getDb();
  const body = await req.json();
  const { name, phone, email } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
  }

  const result = await db.execute({
    sql: "INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)",
    args: [name, phone, email || null],
  });

  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}
