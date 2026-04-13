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
  const params: string[] = [];

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

  const bookings = db.prepare(query).all(...params);
  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { name, phone, service_id, date, time, notes } = body;

  if (!name || !phone || !service_id || !date || !time) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Find or create customer
  let customer = db
    .prepare("SELECT id FROM customers WHERE phone = ?")
    .get(phone) as { id: number } | undefined;

  if (!customer) {
    const result = db
      .prepare("INSERT INTO customers (name, phone) VALUES (?, ?)")
      .run(name, phone);
    customer = { id: Number(result.lastInsertRowid) };
  }

  const result = db
    .prepare(
      "INSERT INTO bookings (customer_id, service_id, customer_name, customer_phone, date, time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(customer.id, service_id, name, phone, date, time, notes || null);

  return NextResponse.json({ id: Number(result.lastInsertRowid), message: "Booking created" });
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, id);
  return NextResponse.json({ message: "Booking updated" });
}
