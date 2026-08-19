import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();

  const [weeklyRes, servicesRes, staffRes, monthlyRes] = await Promise.all([
    db.execute(`
      SELECT DATE(created_at) as day, COALESCE(SUM(total),0) as revenue, COUNT(*) as count
      FROM billing
      WHERE created_at >= DATE('now','-6 days')
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `),
    db.execute(`
      SELECT service_name, COALESCE(SUM(total),0) as revenue, COUNT(*) as count
      FROM billing
      WHERE created_at >= DATE('now','-30 days')
      GROUP BY service_name
      ORDER BY revenue DESC
      LIMIT 6
    `),
    db.execute(`
      SELECT e.name, COALESCE(SUM(b.total),0) as revenue, COUNT(*) as bills
      FROM employees e
      LEFT JOIN billing b ON b.staff_name = e.name AND b.created_at >= DATE('now','-30 days')
      GROUP BY e.name
      ORDER BY revenue DESC
    `),
    db.execute(`
      SELECT strftime('%Y-%m', created_at) as month, COALESCE(SUM(total),0) as revenue, COUNT(*) as count
      FROM billing
      GROUP BY month
      ORDER BY month DESC
      LIMIT 2
    `),
  ]);

  return NextResponse.json({
    weeklyRevenue: weeklyRes.rows,
    topServices: servicesRes.rows,
    staffPerformance: staffRes.rows,
    monthlyRevenue: monthlyRes.rows,
  });
}
