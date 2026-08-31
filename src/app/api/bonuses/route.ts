import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { ensureStaffTables } from "@/lib/ensure-staff-tables";

export const dynamic = "force-dynamic";

interface DailyBreakdown {
  date: string;
  pool: number;
  present_count: number;
  per_share: number;
  present_employee_ids: number[];
}

interface EmployeeBonus {
  employee_id: number;
  name: string;
  total: number;
  days_qualified: number;
}

// Helper: compute bonuses live for a given month from bills + attendance
async function computeMonthLive(month: string) {
  const db = getDb();

  // Fetch bills that contain any eyebrow service, then parse line-by-line
  // service_name format: "ServiceName~~price|||ServiceName~~price"
  const { rows: billRows } = await db.execute({
    sql: `SELECT DATE(created_at) as date, service_name
          FROM billing
          WHERE strftime('%Y-%m', created_at) = ?
            AND LOWER(service_name) LIKE '%eyebrow%'`,
    args: [month],
  });

  // Get all "present" attendance records for the month, grouped by date
  // Only include employees marked as bonus_eligible
  const { rows: attendanceRows } = await db.execute({
    sql: `SELECT a.date, a.employee_id, e.name
          FROM attendance a
          JOIN employees e ON e.id = a.employee_id
          WHERE strftime('%Y-%m', a.date) = ?
            AND a.status IN ('present', 'leave')
            AND e.bonus_eligible = 1
          ORDER BY a.date ASC, e.name ASC`,
    args: [month],
  });

  // Build pool-by-date map: only sum eyebrow line prices, not the whole bill
  const poolByDate = new Map<string, number>();
  for (const r of billRows) {
    const date = String(r.date);
    const lines = String(r.service_name).split("|||");
    let eyebrowTotal = 0;
    for (const line of lines) {
      const [name, priceStr] = line.split("~~");
      if (name && name.toLowerCase().includes("eyebrow")) {
        const price = parseFloat(priceStr) || 0;
        const isWax = name.toLowerCase().includes("wax");
        // Sep 2026 onwards: wax contributes only Rs. 100; before that: full price for both
        eyebrowTotal += (isWax && month >= "2026-09") ? 100 : price;
      }
    }
    if (eyebrowTotal > 0) {
      poolByDate.set(date, (poolByDate.get(date) || 0) + eyebrowTotal);
    }
  }

  // Build present-by-date map
  const presentByDate = new Map<string, { id: number; name: string }[]>();
  for (const r of attendanceRows) {
    const date = String(r.date);
    if (!presentByDate.has(date)) presentByDate.set(date, []);
    presentByDate.get(date)!.push({ id: Number(r.employee_id), name: String(r.name) });
  }

  // Compute daily breakdowns and per-employee tallies
  const daily: DailyBreakdown[] = [];
  const empTotals = new Map<number, { name: string; total: number; days: number }>();

  // Iterate over dates that have a pool (skip days with no eyebrow revenue)
  const dates = Array.from(poolByDate.keys()).sort();
  for (const date of dates) {
    const pool = poolByDate.get(date) || 0;
    const present = presentByDate.get(date) || [];
    const presentCount = present.length;

    let perShare = 0;
    if (pool > 0 && presentCount > 0) {
      perShare = pool / presentCount;
    }

    daily.push({
      date,
      pool,
      present_count: presentCount,
      per_share: perShare,
      present_employee_ids: present.map((p) => p.id),
    });

    // Tally per employee
    if (perShare > 0) {
      for (const emp of present) {
        if (!empTotals.has(emp.id)) {
          empTotals.set(emp.id, { name: emp.name, total: 0, days: 0 });
        }
        const t = empTotals.get(emp.id)!;
        t.total += perShare;
        t.days += 1;
      }
    }
  }

  const employees: EmployeeBonus[] = Array.from(empTotals.entries())
    .map(([id, v]) => ({
      employee_id: id,
      name: v.name,
      total: Math.round(v.total * 100) / 100,
      days_qualified: v.days,
    }))
    .sort((a, b) => b.total - a.total);

  const grandTotal = employees.reduce((sum, e) => sum + e.total, 0);
  const totalPool = daily.reduce((sum, d) => sum + d.pool, 0);

  // Compute 5% service commissions — only for September 2026 onwards (pool model starts then)
  if (month < "2026-09") {
    return {
      month,
      paid: false,
      employees,
      daily,
      grand_total: Math.round(grandTotal * 100) / 100,
      total_pool: Math.round(totalPool * 100) / 100,
      days_with_eyebrows: daily.length,
      commissions: [],
      commission_total: 0,
    };
  }

  const { rows: allBills } = await db.execute({
    sql: `SELECT service_name, DATE(created_at) as date FROM billing WHERE strftime('%Y-%m', created_at) = ?`,
    args: [month],
  });

  // Daily non-eyebrow service revenue → 5% pool
  const servicePoolByDate = new Map<string, number>();
  for (const r of allBills) {
    const date = String(r.date);
    const lines = String(r.service_name).split("|||");
    let nonEyebrowTotal = 0;
    for (const line of lines) {
      const [name, priceStr] = line.split("~~");
      if (!name || name.toLowerCase().includes("eyebrow")) continue;
      const price = parseFloat(priceStr) || 0;
      if (price <= 0) continue; // skip complimentary Rs. 0 lines
      nonEyebrowTotal += price;
    }
    if (nonEyebrowTotal > 0) {
      servicePoolByDate.set(date, (servicePoolByDate.get(date) || 0) + nonEyebrowTotal * 0.05);
    }
  }

  interface CommissionDetail {
    date: string;
    service_revenue: number;
    pool: number;
    per_share: number;
  }

  const commissionTotals = new Map<string, { total: number; days: number; details: CommissionDetail[] }>();

  for (const [date, pool] of servicePoolByDate.entries()) {
    const present = presentByDate.get(date) || [];
    if (present.length === 0) continue;
    const perShare = pool / present.length;
    for (const emp of present) {
      if (!commissionTotals.has(emp.name)) {
        commissionTotals.set(emp.name, { total: 0, days: 0, details: [] });
      }
      const entry = commissionTotals.get(emp.name)!;
      entry.total += perShare;
      entry.days += 1;
      entry.details.push({
        date,
        service_revenue: Math.round(pool / 0.05 * 100) / 100,
        pool: Math.round(pool * 100) / 100,
        per_share: Math.round(perShare * 100) / 100,
      });
    }
  }

  const commissions = Array.from(commissionTotals.entries())
    .map(([name, v]) => ({
      name,
      total: Math.round(v.total * 100) / 100,
      days_qualified: v.days,
      details: v.details.sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => b.total - a.total);

  const commissionGrandTotal = Math.round(commissions.reduce((sum, c) => sum + c.total, 0) * 100) / 100;

  return {
    month,
    paid: false,
    employees,
    daily,
    grand_total: Math.round(grandTotal * 100) / 100,
    total_pool: Math.round(totalPool * 100) / 100,
    days_with_eyebrows: daily.length,
    commissions,
    commission_total: commissionGrandTotal,
  };
}

// Read frozen payouts for an already-paid month
async function getFrozenMonth(month: string) {
  const db = getDb();
  const { rows } = await db.execute({
    sql: `SELECT bp.id, bp.employee_id, e.name, bp.amount, bp.days_qualified, bp.paid_at, bp.notes
          FROM bonus_payouts bp
          JOIN employees e ON e.id = bp.employee_id
          WHERE bp.month = ?
          ORDER BY bp.amount DESC`,
    args: [month],
  });

  if (rows.length === 0) return null;

  const employees = rows.map((r) => ({
    employee_id: Number(r.employee_id),
    name: String(r.name),
    total: Number(r.amount),
    days_qualified: Number(r.days_qualified),
  }));

  const grandTotal = employees.reduce((sum, e) => sum + e.total, 0);

  return {
    month,
    paid: true,
    paid_at: rows[0].paid_at,
    employees,
    daily: [],
    grand_total: Math.round(grandTotal * 100) / 100,
    total_pool: Math.round(grandTotal * 100) / 100,
    days_with_eyebrows: 0,
    commissions: [],
    commission_total: 0,
  };
}

export async function GET(req: NextRequest) {
  await ensureStaffTables();
  const db = getDb();
  const { searchParams } = new URL(req.url);

  // History endpoint: list all paid months
  if (searchParams.get("history") === "true") {
    const { rows } = await db.execute({
      sql: `SELECT month, SUM(amount) as total, COUNT(*) as employee_count, MAX(paid_at) as paid_at
            FROM bonus_payouts
            GROUP BY month
            ORDER BY month DESC`,
    });
    return NextResponse.json({
      months: rows.map((r) => ({
        month: String(r.month),
        total: Math.round(Number(r.total) * 100) / 100,
        employee_count: Number(r.employee_count),
        paid_at: r.paid_at,
      })),
    });
  }

  // Specific month: return frozen if paid, else live
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const frozen = await getFrozenMonth(month);
  if (frozen) return NextResponse.json(frozen);

  const live = await computeMonthLive(month);
  return NextResponse.json(live);
}

// POST: mark a month as paid (freeze the live calc into bonus_payouts)
export async function POST(req: NextRequest) {
  await ensureStaffTables();
  const db = getDb();
  const body = await req.json();
  const { month, notes } = body;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month (expected YYYY-MM)" }, { status: 400 });
  }

  // Don't allow re-paying an already-paid month
  const existing = await db.execute({
    sql: "SELECT COUNT(*) as c FROM bonus_payouts WHERE month = ?",
    args: [month],
  });
  if (Number(existing.rows[0].c) > 0) {
    return NextResponse.json({ error: "This month has already been paid out" }, { status: 400 });
  }

  // Compute live, then snapshot
  const live = await computeMonthLive(month);

  if (live.employees.length === 0) {
    return NextResponse.json({ error: "No bonus to pay for this month" }, { status: 400 });
  }

  for (const emp of live.employees) {
    await db.execute({
      sql: `INSERT INTO bonus_payouts (employee_id, month, amount, days_qualified, notes)
            VALUES (?, ?, ?, ?, ?)`,
      args: [emp.employee_id, month, emp.total, emp.days_qualified, notes || null],
    });
  }

  return NextResponse.json({
    success: true,
    month,
    employee_count: live.employees.length,
    grand_total: live.grand_total,
  });
}
