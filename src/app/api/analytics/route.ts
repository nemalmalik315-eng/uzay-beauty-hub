import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { isAuthenticated, unauthorized } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

async function safeQuery(db: ReturnType<typeof import("@/lib/db").default>, sql: string) {
  try {
    const res = await db.execute(sql);
    return res.rows;
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const db = getDb();

  const [weeklyRows, servicesRows, staffRows, monthlyRows] = await Promise.all([
    safeQuery(db, `
      SELECT DATE(created_at) as day, COALESCE(SUM(total),0) as revenue, COUNT(*) as count
      FROM billing
      WHERE created_at >= DATE('now','-13 days')
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `),
    safeQuery(db, `
      WITH RECURSIVE split(service_part, rest) AS (
        SELECT '', service_name || '|||' FROM billing
        UNION ALL
        SELECT
          SUBSTR(rest, 1, INSTR(rest, '|||') - 1),
          SUBSTR(rest, INSTR(rest, '|||') + 3)
        FROM split WHERE INSTR(rest, '|||') > 0
      )
      SELECT
        CASE WHEN INSTR(service_part, '~~') > 0
          THEN TRIM(SUBSTR(service_part, 1, INSTR(service_part, '~~') - 1))
          ELSE TRIM(service_part)
        END as clean_name,
        SUM(CASE WHEN INSTR(service_part, '~~') > 0
          THEN CAST(TRIM(SUBSTR(service_part, INSTR(service_part, '~~') + 2)) AS REAL)
          ELSE 0
        END) as revenue,
        COUNT(*) as count
      FROM split
      WHERE service_part != ''
      GROUP BY clean_name
      ORDER BY revenue DESC
      LIMIT 6
    `),
    safeQuery(db, `
      SELECT
        TRIM(performed_by) as name,
        SUM(total) as revenue,
        COUNT(*) as bills
      FROM billing
      WHERE performed_by IS NOT NULL AND TRIM(performed_by) != ''
        AND created_at >= DATE('now','-30 days')
      GROUP BY TRIM(performed_by)
      ORDER BY revenue DESC
    `),
    safeQuery(db, `
      SELECT strftime('%Y-%m', created_at) as month, COALESCE(SUM(total),0) as revenue, COUNT(*) as count
      FROM billing
      GROUP BY month
      ORDER BY month DESC
      LIMIT 2
    `),
  ]);

  return NextResponse.json({
    weeklyRevenue: weeklyRows,
    topServices: servicesRows.map((r) => ({ ...r, service_name: r.clean_name })),
    staffPerformance: staffRows,
    monthlyRevenue: monthlyRows,
  });
}
