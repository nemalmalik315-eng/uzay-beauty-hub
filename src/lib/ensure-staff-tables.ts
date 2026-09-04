import getDb from "@/lib/db";

let initialized = false;

export async function ensureStaffTables() {
  if (initialized) return;
  const db = getDb();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Stylist',
      shift_start TEXT NOT NULL DEFAULT '11:00',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'absent',
      check_in_time TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      UNIQUE(employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS bonus_payouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      amount REAL NOT NULL,
      days_qualified INTEGER NOT NULL DEFAULT 0,
      paid_at TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      UNIQUE(employee_id, month)
    );

    CREATE TABLE IF NOT EXISTS commission_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      performer_name TEXT NOT NULL,
      total REAL NOT NULL,
      days_qualified INTEGER NOT NULL DEFAULT 0,
      details_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  // Add columns that may not exist on older installs
  for (const col of [
    "salary REAL NOT NULL DEFAULT 0",
    "bonus_eligible INTEGER NOT NULL DEFAULT 1",
    "sunday_shift_start TEXT",
    "shift_change_date TEXT",
    "shift_start_before TEXT",
  ]) {
    try { await db.execute(`ALTER TABLE employees ADD COLUMN ${col}`); } catch { /* exists */ }
  }

  initialized = true;
}
