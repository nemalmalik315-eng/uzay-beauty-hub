import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { ensureStaffTables } from "@/lib/ensure-staff-tables";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureStaffTables();
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  // Get all active employees with their attendance for the given date
  const { rows } = await db.execute({
    sql: `SELECT e.id as employee_id, e.name, e.phone, e.role, e.shift_start,
            a.id as attendance_id, a.status, a.check_in_time, a.notes
          FROM employees e
          LEFT JOIN attendance a ON e.id = a.employee_id AND a.date = ?
          WHERE e.active = 1
          ORDER BY e.name ASC`,
    args: [date],
  });

  // Summary counts
  const summary = {
    total: rows.length,
    present: rows.filter((r) => r.status === "present").length,
    late: rows.filter((r) => r.status === "late").length,
    absent: rows.filter((r) => r.status === "absent").length,
    leave: rows.filter((r) => r.status === "leave").length,
    uninformed: rows.filter((r) => r.status === "uninformed").length,
    unmarked: rows.filter((r) => !r.status).length,
  };

  return NextResponse.json({ attendance: rows, summary, date });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { employee_id, date, status, check_in_time, notes } = body;

  if (!employee_id || !date || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Upsert — insert or replace for the same employee+date
  await db.execute({
    sql: `INSERT INTO attendance (employee_id, date, status, check_in_time, notes)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(employee_id, date)
          DO UPDATE SET status = ?, check_in_time = ?, notes = ?`,
    args: [employee_id, date, status, check_in_time || null, notes || null, status, check_in_time || null, notes || null],
  });

  return NextResponse.json({ message: "Attendance marked" });
}

export async function PATCH(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { id, status, notes } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const sets: string[] = [];
  const args: (string | number | null)[] = [];

  if (status) { sets.push("status = ?"); args.push(status); }
  if (notes !== undefined) { sets.push("notes = ?"); args.push(notes || null); }

  if (sets.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  args.push(id);
  await db.execute({ sql: `UPDATE attendance SET ${sets.join(", ")} WHERE id = ?`, args });
  return NextResponse.json({ message: "Attendance updated" });
}
