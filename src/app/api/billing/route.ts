import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");
  const date = searchParams.get("date");

  let query = "SELECT * FROM billing";
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (period === "today" || (!period && !date)) {
    conditions.push("DATE(created_at) = DATE('now')");
  } else if (period === "week") {
    conditions.push("DATE(created_at) >= DATE('now', '-7 days')");
  } else if (period === "month") {
    conditions.push("DATE(created_at) >= DATE('now', '-30 days')");
  } else if (date) {
    conditions.push("DATE(created_at) = ?");
    params.push(date);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY created_at DESC";

  const { rows: bills } = await db.execute({ sql: query, args: params });

  const summaryQuery = `SELECT
    COALESCE(SUM(service_charge), 0) as total_charges,
    COALESCE(SUM(discount), 0) as total_discounts,
    COALESCE(SUM(total), 0) as total_revenue,
    COUNT(*) as total_transactions
  FROM billing
  WHERE ${conditions.length > 0 ? conditions.join(" AND ") : "1=1"}`;

  const { rows: summaryRows } = await db.execute({ sql: summaryQuery, args: params });
  const summary = summaryRows[0];

  return NextResponse.json({ bills, summary });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const {
    booking_id,
    customer_id,
    customer_name,
    service_name,
    service_charge,
    discount = 0,
    payment_method = "cash",
  } = body;

  if (!customer_name || !service_name || service_charge === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const total = service_charge - discount;

  const result = await db.execute({
    sql: `INSERT INTO billing (booking_id, customer_id, customer_name, service_name, service_charge, discount, total, payment_method)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      booking_id || null,
      customer_id || null,
      customer_name,
      service_name,
      service_charge,
      discount,
      total,
      payment_method,
    ],
  });

  if (booking_id) {
    await db.execute({ sql: "UPDATE bookings SET status = 'completed' WHERE id = ?", args: [booking_id] });
  }

  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}
