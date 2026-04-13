import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  let query = `
    SELECT b.*, s.name as service_name, s.price as service_price, s.category
    FROM bookings b
    JOIN services s ON b.service_id = s.id
  `;
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (date) {
    conditions.push("b.date = ?");
    params.push(date);
  }
  if (status) {
    conditions.push("b.status = ?");
    params.push(status);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY b.date DESC, b.time DESC";

  const { rows } = await db.execute({ sql: query, args: params });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { name, phone, date, time, notes } = body;

  const serviceIds: number[] = body.service_ids
    ? body.service_ids
    : body.service_id
    ? [Number(body.service_id)]
    : [];

  if (!name || !phone || !date || !time || serviceIds.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Find or create customer
  const { rows: customerRows } = await db.execute({
    sql: "SELECT id FROM customers WHERE phone = ?",
    args: [phone],
  });

  let customerId: number;
  if (customerRows.length > 0) {
    customerId = customerRows[0].id as number;
  } else {
    const result = await db.execute({
      sql: "INSERT INTO customers (name, phone) VALUES (?, ?)",
      args: [name, phone],
    });
    customerId = Number(result.lastInsertRowid);
  }

  // Create a booking for each selected service
  const ids: number[] = [];
  for (const sid of serviceIds) {
    const result = await db.execute({
      sql: "INSERT INTO bookings (customer_id, service_id, customer_name, customer_phone, date, time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [customerId, sid, name, phone, date, time, notes || null],
    });
    ids.push(Number(result.lastInsertRowid));
  }

  return NextResponse.json({
    ids,
    message: `${ids.length} booking${ids.length > 1 ? "s" : ""} created`,
  });
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  await db.execute({ sql: "UPDATE bookings SET status = ? WHERE id = ?", args: [status, id] });
  return NextResponse.json({ message: "Booking updated" });
}
