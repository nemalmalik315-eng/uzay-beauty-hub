import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "daily"; // daily, weekly, monthly

  let query = "";

  if (type === "daily") {
    query = `
      SELECT
        DATE(created_at) as period,
        COUNT(*) as transactions,
        COALESCE(SUM(service_charge), 0) as charges,
        COALESCE(SUM(discount), 0) as discounts,
        COALESCE(SUM(total), 0) as revenue
      FROM billing
      WHERE DATE(created_at) >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY period DESC
    `;
  } else if (type === "weekly") {
    query = `
      SELECT
        strftime('%Y-W%W', created_at) as period,
        COUNT(*) as transactions,
        COALESCE(SUM(service_charge), 0) as charges,
        COALESCE(SUM(discount), 0) as discounts,
        COALESCE(SUM(total), 0) as revenue
      FROM billing
      WHERE DATE(created_at) >= DATE('now', '-90 days')
      GROUP BY strftime('%Y-W%W', created_at)
      ORDER BY period DESC
    `;
  } else {
    query = `
      SELECT
        strftime('%Y-%m', created_at) as period,
        COUNT(*) as transactions,
        COALESCE(SUM(service_charge), 0) as charges,
        COALESCE(SUM(discount), 0) as discounts,
        COALESCE(SUM(total), 0) as revenue
      FROM billing
      WHERE DATE(created_at) >= DATE('now', '-365 days')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY period DESC
    `;
  }

  const data = db.prepare(query).all();

  // Today's summary
  const today = db
    .prepare(
      `SELECT
        COUNT(*) as transactions,
        COALESCE(SUM(total), 0) as revenue,
        COALESCE(SUM(discount), 0) as discounts
      FROM billing
      WHERE DATE(created_at) = DATE('now')`
    )
    .get();

  // Total bookings today
  const todayBookings = db
    .prepare("SELECT COUNT(*) as count FROM bookings WHERE date = DATE('now')")
    .get();

  return NextResponse.json({ data, today, todayBookings });
}
