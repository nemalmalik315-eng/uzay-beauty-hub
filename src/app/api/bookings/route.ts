import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

function parseGroupedRows(rows: Record<string, unknown>[]) {
  return rows.map((r) => {
    const servicesRaw = String(r.services_raw || "");
    const services = servicesRaw
      .split("|||")
      .filter(Boolean)
      .map((part) => {
        const [id, name, price, category] = part.split("~~");
        return { id: Number(id), name: name || "", price: Number(price) || 0, category: category || "" };
      });
    const total = Number(r.total) || 0;
    const discount = Number(r.discount) || 0;
    return {
      id: Number(r.group_id), // kept for badge-count compat in layout
      group_id: Number(r.group_id),
      customer_name: String(r.customer_name || ""),
      customer_phone: String(r.customer_phone || ""),
      date: String(r.date || ""),
      time: String(r.time || ""),
      notes: r.notes ? String(r.notes) : "",
      status: String(r.status || "pending"),
      discount,
      complimentary_service: r.complimentary_service ? String(r.complimentary_service) : "",
      services,
      total,
      final_total: total - discount,
    };
  });
}

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  const whereClause = date ? "WHERE b.date = ?" : "";
  const havingClause = status ? "HAVING MAX(b.status) = ?" : "";
  const args: (string)[] = [...(date ? [date] : []), ...(status ? [status] : [])];

  const query = `
    SELECT
      COALESCE(b.booking_group_id, b.id) as group_id,
      b.customer_name,
      b.customer_phone,
      b.date,
      b.time,
      b.notes,
      MAX(b.status) as status,
      MAX(COALESCE(b.discount, 0)) as discount,
      MAX(COALESCE(b.complimentary_service, '')) as complimentary_service,
      GROUP_CONCAT(b.id || '~~' || s.name || '~~' || s.price || '~~' || COALESCE(s.category,''), '|||') as services_raw,
      SUM(s.price) as total
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    ${whereClause}
    GROUP BY COALESCE(b.booking_group_id, b.id), b.customer_name, b.customer_phone, b.date, b.time, b.notes
    ${havingClause}
    ORDER BY group_id DESC
  `;
  const { rows } = await db.execute({ sql: query, args });
  return NextResponse.json(parseGroupedRows(rows as Record<string, unknown>[]));
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

  // Insert all bookings; first ID becomes the group_id for the whole batch
  const ids: number[] = [];
  for (const sid of serviceIds) {
    const result = await db.execute({
      sql: "INSERT INTO bookings (customer_id, service_id, customer_name, customer_phone, date, time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [customerId, sid, name, phone, date, time, notes || null],
    });
    ids.push(Number(result.lastInsertRowid));
  }

  // Assign group_id = first booking's id for all bookings in this batch
  if (ids.length > 0) {
    const groupId = ids[0];
    for (const bookingId of ids) {
      await db.execute({
        sql: "UPDATE bookings SET booking_group_id = ? WHERE id = ?",
        args: [groupId, bookingId],
      });
    }
  }

  return NextResponse.json({ ids, message: `${ids.length} booking${ids.length > 1 ? "s" : ""} created` });
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  try { await db.execute("ALTER TABLE bookings ADD COLUMN complimentary_service TEXT"); } catch { /* exists */ }
  const body = await req.json();
  // group_id is COALESCE(booking_group_id, id) — updates all bookings in the group
  const { group_id, status, date, time, discount, complimentary_service } = body;

  if (!group_id) {
    return NextResponse.json({ error: "Missing group_id" }, { status: 400 });
  }

  const sets: string[] = [];
  const args: (string | number | null)[] = [];

  if (status !== undefined) { sets.push("status = ?"); args.push(status); }
  if (date !== undefined) { sets.push("date = ?"); args.push(date); }
  if (time !== undefined) { sets.push("time = ?"); args.push(time); }
  if (discount !== undefined) { sets.push("discount = ?"); args.push(discount); }
  if (complimentary_service !== undefined) { sets.push("complimentary_service = ?"); args.push(complimentary_service || null); }

  if (sets.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  args.push(group_id);
  await db.execute({
    sql: `UPDATE bookings SET ${sets.join(", ")} WHERE COALESCE(booking_group_id, id) = ?`,
    args,
  });

  return NextResponse.json({ message: "Booking updated" });
}
