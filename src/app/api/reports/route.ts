import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "daily";

  // ── Insights: peak hours + category revenue + retention ──────────────────
  if (type === "insights") {
    // Peak hours — count distinct appointment groups by day-of-week × hour
    const { rows: peakRows } = await db.execute(`
      SELECT
        strftime('%w', date) as day_of_week,
        CASE
          WHEN time LIKE '12%AM' THEN 0
          WHEN time LIKE '%AM'   THEN CAST(TRIM(SUBSTR(time, 1, INSTR(time,':') - 1)) AS INTEGER)
          WHEN time LIKE '12%PM' THEN 12
          WHEN time LIKE '%PM'   THEN CAST(TRIM(SUBSTR(time, 1, INSTR(time,':') - 1)) AS INTEGER) + 12
          ELSE 0
        END as hour_24,
        COUNT(DISTINCT COALESCE(booking_group_id, id)) as count
      FROM bookings
      WHERE status IN ('confirmed','completed')
        AND date >= DATE('now', '-90 days')
      GROUP BY day_of_week, hour_24
    `);

    // Category revenue — parse billing service_name, match against services table
    const { rows: svcRows } = await db.execute("SELECT name, category FROM services WHERE active = 1");
    const { rows: billRows } = await db.execute(`
      SELECT service_name FROM billing
      WHERE DATE(created_at) >= DATE('now', '-30 days')
    `);
    const svcMap = new Map(svcRows.map((s) => [s.name as string, s.category as string]));
    const catMap: Record<string, number> = {};
    for (const bill of billRows) {
      const parts = (bill.service_name as string).split("|||");
      for (const part of parts) {
        const [name, priceStr] = part.split("~~");
        const cat = svcMap.get(name?.trim()) ?? "Other";
        catMap[cat] = (catMap[cat] ?? 0) + (Number(priceStr) || 0);
      }
    }
    const categoryRevenue = Object.entries(catMap)
      .filter(([, v]) => v > 0)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // Client retention
    const { rows: retRows } = await db.execute(`
      SELECT
        COUNT(DISTINCT customer_id) as total_clients,
        COUNT(DISTINCT CASE WHEN visit_count >= 2 THEN customer_id END) as returning_clients
      FROM (
        SELECT customer_id, COUNT(DISTINCT DATE(created_at)) as visit_count
        FROM billing
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
      )
    `);
    const { rows: newRows } = await db.execute(`
      SELECT COUNT(DISTINCT customer_id) as new_this_month
      FROM billing
      WHERE customer_id IS NOT NULL
        AND DATE(created_at) >= DATE('now','start of month')
        AND customer_id NOT IN (
          SELECT DISTINCT customer_id FROM billing
          WHERE customer_id IS NOT NULL
            AND DATE(created_at) < DATE('now','start of month')
        )
    `);
    const { rows: avgRows } = await db.execute(`
      SELECT ROUND(AVG(avg_gap)) as avg_days FROM (
        SELECT customer_id, AVG(gap) as avg_gap FROM (
          SELECT customer_id,
            JULIANDAY(created_at) -
            LAG(JULIANDAY(created_at)) OVER (PARTITION BY customer_id ORDER BY created_at) as gap
          FROM billing WHERE customer_id IS NOT NULL
        ) WHERE gap IS NOT NULL
        GROUP BY customer_id
      )
    `);

    return NextResponse.json({
      peakHours: peakRows,
      categoryRevenue,
      retention: {
        total: Number(retRows[0]?.total_clients ?? 0),
        returning: Number(retRows[0]?.returning_clients ?? 0),
        newThisMonth: Number(newRows[0]?.new_this_month ?? 0),
        avgDaysBetweenVisits: Number(avgRows[0]?.avg_days ?? 0),
      },
    });
  }

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

  const { rows: data } = await db.execute(query);

  const { rows: todayRows } = await db.execute(`
    SELECT
      COUNT(*) as transactions,
      COALESCE(SUM(total), 0) as revenue,
      COALESCE(SUM(discount), 0) as discounts
    FROM billing
    WHERE DATE(created_at) = DATE('now')
  `);
  const today = todayRows[0];

  const { rows: bookingRows } = await db.execute(
    "SELECT COUNT(*) as count FROM bookings WHERE date = DATE('now')"
  );
  const todayBookings = bookingRows[0];

  return NextResponse.json({ data, today, todayBookings });
}
