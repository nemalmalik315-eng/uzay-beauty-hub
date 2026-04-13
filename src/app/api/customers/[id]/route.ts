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

  // Get booking history
  const { rows: bookings } = await db.execute({
    sql: `SELECT b.*, s.name as service_name, s.price as service_price, s.category
          FROM bookings b JOIN services s ON b.service_id = s.id
          WHERE b.customer_id = ? ORDER BY b.date DESC, b.time DESC`,
    args: [Number(id)],
  });

  // Calculate totals
  const totalSpent = bills.reduce((sum, b) => sum + (b.total as number), 0);
  const totalVisits = bills.length;
  const totalDiscount = bills.reduce((sum, b) => sum + (b.discount as number), 0);

  return NextResponse.json({
    customer: customers[0],
    bills,
    bookings,
    stats: {
      totalSpent,
      totalVisits,
      totalDiscount,
      lastVisit: bills.length > 0 ? bills[0].created_at : null,
    },
  });
}
