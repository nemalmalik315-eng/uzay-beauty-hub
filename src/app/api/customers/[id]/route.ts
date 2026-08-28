import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;

  // Get customer info
  const { rows: customers } = await db.execute({
    sql: "SELECT * FROM customers WHERE id = ?",
    args: [Number(id)],
  });

  if (customers.length === 0) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Get billing history
  const { rows: bills } = await db.execute({
    sql: "SELECT * FROM billing WHERE customer_id = ? ORDER BY created_at DESC",
    args: [Number(id)],
  });

  // Get grouped booking history
  const { rows: bookingRows } = await db.execute({
    sql: `SELECT
            COALESCE(b.booking_group_id, b.id) as group_id,
            b.date, b.time,
            MAX(b.status) as status,
            GROUP_CONCAT(s.name, ' + ') as service_names,
            SUM(s.price) as subtotal,
            MAX(COALESCE(b.discount, 0)) as discount
          FROM bookings b JOIN services s ON b.service_id = s.id
          WHERE b.customer_id = ?
          GROUP BY COALESCE(b.booking_group_id, b.id)
          ORDER BY b.date DESC, b.time DESC`,
    args: [Number(id)],
  });

  const bookingHistory = bookingRows.map((r) => ({
    group_id: Number(r.group_id),
    date: String(r.date),
    time: String(r.time),
    status: String(r.status),
    service_names: String(r.service_names || ""),
    total: Number(r.subtotal) || 0,
    discount: Number(r.discount) || 0,
  }));

  // Calculate totals — group by date so multiple services on the same day = 1 visit
  const totalSpent = bills.reduce((sum, b) => sum + (b.total as number), 0);
  const uniqueVisitDates = new Set(bills.map((b) => (b.created_at as string).slice(0, 10)));
  const totalVisits = uniqueVisitDates.size;
  const totalDiscount = bills.reduce((sum, b) => sum + (b.discount as number), 0);

  return NextResponse.json({
    customer: customers[0],
    bills,
    bookingHistory,
    stats: {
      totalSpent,
      totalVisits,
      totalDiscount,
      lastVisit: bills.length > 0 ? bills[0].created_at : null,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  const { name, phone, email, surname, house_no, society, notes } = body;

  await db.execute({
    sql: `UPDATE customers SET
            name    = COALESCE(?, name),
            phone   = COALESCE(?, phone),
            email   = ?,
            surname = ?,
            house_no = ?,
            society = ?,
            notes   = ?
          WHERE id = ?`,
    args: [name || null, phone || null, email || null, surname || null, house_no || null, society || null, notes || null, Number(id)],
  });

  return NextResponse.json({ success: true });
}
