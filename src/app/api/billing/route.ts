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
    conditions.push("strftime('%Y-%W', created_at) = strftime('%Y-%W', 'now')");
  } else if (period === "month") {
    conditions.push("strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')");
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
    customer_phone,
    service_name,
    service_charge,
    discount = 0,
    payment_method = "cash",
    bill_date,
  } = body;

  if (!customer_name || !service_name || service_charge === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Prevent duplicate billing for same booking group
  if (booking_id) {
    const { rows: existing } = await db.execute({
      sql: "SELECT id FROM billing WHERE booking_id = ?",
      args: [booking_id],
    });
    if (existing.length > 0) {
      return NextResponse.json({ id: existing[0].id, duplicate: true });
    }
  }

  // Find or create customer if phone provided
  let resolvedCustomerId = customer_id || null;
  if (customer_phone && !resolvedCustomerId) {
    const { rows: existing } = await db.execute({
      sql: "SELECT id FROM customers WHERE phone = ?",
      args: [customer_phone],
    });
    if (existing.length > 0) {
      resolvedCustomerId = existing[0].id;
    } else {
      const custResult = await db.execute({
        sql: "INSERT INTO customers (name, phone) VALUES (?, ?)",
        args: [customer_name, customer_phone],
      });
      resolvedCustomerId = Number(custResult.lastInsertRowid);
    }
  }

  const total = service_charge - discount;

  const result = await db.execute(
    bill_date
      ? {
          sql: `INSERT INTO billing (booking_id, customer_id, customer_name, service_name, service_charge, discount, total, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [booking_id || null, resolvedCustomerId, customer_name, service_name, service_charge, discount, total, payment_method, bill_date],
        }
      : {
          sql: `INSERT INTO billing (booking_id, customer_id, customer_name, service_name, service_charge, discount, total, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [booking_id || null, resolvedCustomerId, customer_name, service_name, service_charge, discount, total, payment_method],
        }
  );

  return NextResponse.json({ id: Number(result.lastInsertRowid), customer_id: resolvedCustomerId });
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { id, service_name, service_charge, discount = 0, payment_method = "cash", bill_date } = body;

  if (!id || !service_name || service_charge === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const total = service_charge - discount;

  const sets = ["service_name = ?", "service_charge = ?", "discount = ?", "total = ?", "payment_method = ?"];
  const args: (string | number)[] = [service_name, service_charge, discount, total, payment_method];

  if (bill_date) {
    sets.push("created_at = ?");
    args.push(bill_date);
  }

  args.push(Number(id));
  await db.execute({ sql: `UPDATE billing SET ${sets.join(", ")} WHERE id = ?`, args });

  return NextResponse.json({ id: Number(id) });
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await db.execute({ sql: "DELETE FROM billing WHERE id = ?", args: [Number(id)] });
  return NextResponse.json({ message: "Bill deleted" });
}
