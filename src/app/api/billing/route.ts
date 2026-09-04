import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

let billingColsEnsured = false;
async function ensureBillingColumns() {
  if (billingColsEnsured) return;
  const db = getDb();
  try { await db.execute("ALTER TABLE billing ADD COLUMN payment_status TEXT DEFAULT 'paid'"); } catch { /* exists */ }
  try { await db.execute("ALTER TABLE billing ADD COLUMN amount_paid REAL"); } catch { /* exists */ }
  try { await db.execute("ALTER TABLE billing ADD COLUMN performed_by TEXT"); } catch { /* exists */ }
  try { await db.execute("ALTER TABLE billing ADD COLUMN billed_by TEXT"); } catch { /* exists */ }
  billingColsEnsured = true;
}

export async function GET(req: NextRequest) {
  await ensureBillingColumns();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period");
  const date = searchParams.get("date");
  const month = searchParams.get("month"); // YYYY-MM format for past months

  const paymentStatus = searchParams.get("payment_status");

  let query = "SELECT b.*, COALESCE(c.phone, '') as customer_phone FROM billing b LEFT JOIN customers c ON c.id = b.customer_id";
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (paymentStatus) {
    conditions.push("b.payment_status = ?");
    params.push(paymentStatus);
  }

  if (month) {
    conditions.push("strftime('%Y-%m', b.created_at) = ?");
    params.push(month);
  } else if (period === "today" || (!period && !date)) {
    conditions.push("DATE(b.created_at) = DATE('now')");
  } else if (period === "week") {
    conditions.push("strftime('%Y-%W', b.created_at) = strftime('%Y-%W', 'now')");
  } else if (period === "month") {
    conditions.push("strftime('%Y-%m', b.created_at) = strftime('%Y-%m', 'now')");
  } else if (date) {
    conditions.push("DATE(b.created_at) = ?");
    params.push(date);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY b.created_at DESC";

  const { rows: bills } = await db.execute({ sql: query, args: params });

  const summaryQuery = `SELECT
    COALESCE(SUM(service_charge), 0) as total_charges,
    COALESCE(SUM(discount), 0) as total_discounts,
    COALESCE(SUM(CASE
      WHEN payment_status = 'paid' THEN total
      WHEN payment_status = 'partial' THEN COALESCE(amount_paid, 0)
      ELSE 0
    END), 0) as total_revenue,
    COUNT(*) as total_transactions
  FROM billing
  WHERE ${conditions.length > 0 ? conditions.map(c => c.replace(/^b\./, "")).join(" AND ") : "1=1"}`;

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
    payment_status = "paid",
    amount_paid,
    bill_date,
    performed_by,
    billed_by,
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

  const effectivePaid = amount_paid ?? total;
  const result = await db.execute(
    bill_date
      ? {
          sql: `INSERT INTO billing (booking_id, customer_id, customer_name, service_name, service_charge, discount, total, payment_method, payment_status, amount_paid, performed_by, billed_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [booking_id || null, resolvedCustomerId, customer_name, service_name, service_charge, discount, total, payment_method, payment_status, effectivePaid, performed_by || null, billed_by || null, bill_date],
        }
      : {
          sql: `INSERT INTO billing (booking_id, customer_id, customer_name, service_name, service_charge, discount, total, payment_method, payment_status, amount_paid, performed_by, billed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [booking_id || null, resolvedCustomerId, customer_name, service_name, service_charge, discount, total, payment_method, payment_status, effectivePaid, performed_by || null, billed_by || null],
        }
  );

  return NextResponse.json({ id: Number(result.lastInsertRowid), customer_id: resolvedCustomerId });
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { id, service_name, service_charge, discount = 0, payment_method = "cash", payment_status, amount_paid, bill_date, performed_by, billed_by } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const sets: string[] = [];
  const args: (string | number)[] = [];

  if (service_name !== undefined) {
    const total = (service_charge ?? 0) - (discount ?? 0);
    sets.push("service_name = ?", "service_charge = ?", "discount = ?", "total = ?", "payment_method = ?");
    args.push(service_name, service_charge ?? 0, discount ?? 0, total, payment_method);
  }
  if (payment_status !== undefined) { sets.push("payment_status = ?"); args.push(payment_status); }
  if (amount_paid !== undefined) { sets.push("amount_paid = ?"); args.push(amount_paid); }
  if (bill_date) { sets.push("created_at = ?"); args.push(bill_date); }
  if (performed_by !== undefined) { sets.push("performed_by = ?"); args.push(performed_by || null); }
  if (billed_by !== undefined) { sets.push("billed_by = ?"); args.push(billed_by || null); }

  if (sets.length === 0) return NextResponse.json({ id: Number(id) });

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
