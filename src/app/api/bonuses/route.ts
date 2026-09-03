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

  // Monthly revenue and salary totals
  const { rows: revRows } = await db.execute({
    sql: `SELECT COALESCE(SUM(total), 0) as revenue FROM billing WHERE strftime('%Y-%m', created_at) = ?`,
    args: [month],
  });
  const monthRevenue = Math.round((Number(revRows[0]?.revenue) || 0) * 100) / 100;

  const { rows: salRows } = await db.execute({
    sql: `SELECT COALESCE(SUM(salary), 0) as total FROM employees WHERE active = 1`,
  });
  const totalSalaries = Math.round((Number(salRows[0]?.total) || 0) * 100) / 100;

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
        const isWax = name.toLowerCase().includes("wax");
        if (isWax && month < "2026-09") continue; // wax not in pool before Sep 2026
        const price = parseFloat(priceStr) || 0;
        eyebrowTotal += isWax ? 100 : price; // wax: only Rs. 100 from Sep 2026 onwards
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
      month_revenue: monthRevenue,
      total_salaries: totalSalaries,
    };
  }

  // Per-performer commission: 5% of each bill's non-eyebrow revenue AFTER discount, split among performers
  const { rows: commissionBills } = await db.execute({
    sql: `SELECT performed_by, service_name, service_charge, discount, total, DATE(created_at) as date
          FROM billing
          WHERE strftime('%Y-%m', created_at) = ?
            AND performed_by IS NOT NULL AND performed_by != ''`,
    args: [month],
  });

  interface CommissionDetail {
    date: string;
    services: string;
    bill_total: number;
    commission: number;
    performers: number;
    per_share: number;
  }

  const commissionTotals = new Map<string, { total: number; details: CommissionDetail[] }>();

  for (const row of commissionBills) {
    const performers = String(row.performed_by).split(" + ").map((n) => n.trim()).filter(Boolean);
    if (performers.length === 0) continue;

    const lines = String(row.service_name).split("|||");
    let nonEyebrowTotal = 0;
    let allServicesTotal = 0;
    const nonEyebrowServiceNames: string[] = [];

    for (const line of lines) {
      const [name, priceStr] = line.split("~~");
      const price = parseFloat(priceStr) || 0;
      if (price <= 0) continue; // skip complimentary/free
      allServicesTotal += price;
      if (!name || name.toLowerCase().includes("eyebrow")) continue;
      nonEyebrowTotal += price;
      nonEyebrowServiceNames.push(name.replace(/^🎁\s*/, ""));
    }

    if (nonEyebrowTotal <= 0) continue;

    // Discount applies entirely to non-eyebrow services
    const discount = Number(row.discount) || 0;
    const nonEyebrowAfterDiscount = Math.max(0, nonEyebrowTotal - discount);

    if (nonEyebrowAfterDiscount <= 0) continue;

    const commission = nonEyebrowAfterDiscount * 0.05;
    const perShare = commission / performers.length;
    const date = String(row.date);

    for (const performer of performers) {
      if (!commissionTotals.has(performer)) {
        commissionTotals.set(performer, { total: 0, details: [] });
      }
      const entry = commissionTotals.get(performer)!;
      entry.total += perShare;
      entry.details.push({
        date,
        services: nonEyebrowServiceNames.join(", "),
        bill_total: Math.round(nonEyebrowAfterDiscount * 100) / 100,
        commission: Math.round(commission * 100) / 100,
        performers: performers.length,
        per_share: Math.round(perShare * 100) / 100,
      });
    }
  }

  const commissions = Array.from(commissionTotals.entries())
    .map(([name, v]) => ({
      name,
      total: Math.round(v.total * 100) / 100,
      days_qualified: [...new Set(v.details.map((d) => d.date))].length,
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
    month_revenue: monthRevenue,
    total_salaries: totalSalaries,
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

  const { rows: revRows } = await db.execute({
    sql: `SELECT COALESCE(SUM(total), 0) as revenue FROM billing WHERE strftime('%Y-%m', created_at) = ?`,
    args: [month],
  });
  const { rows: salRows } = await db.execute({
    sql: `SELECT COALESCE(SUM(salary), 0) as total FROM employees WHERE active = 1`,
  });
  const monthRevenue = Math.round((Number(revRows[0]?.revenue) || 0) * 100) / 100;
  const totalSalaries = Math.round((Number(salRows[0]?.total) || 0) * 100) / 100;

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
    month_revenue: monthRevenue,
    total_salaries: totalSalaries,
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
