"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/admin/Toast";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface Employee {
  id: number;
  name: string;
  phone: string;
  role: string;
  shift_start: string;
  sunday_shift_start: string | null;
  active: number;
  salary: number;
  bonus_eligible: number;
}

interface AttendanceRow {
  employee_id: number;
  name: string;
  phone: string;
  role: string;
  shift_start: string;
  attendance_id: number | null;
  status: string | null;
  check_in_time: string | null;
  notes: string | null;
}

interface AttendanceSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  uninformed: number;
  unmarked: number;
}

type Tab = "team" | "attendance" | "bonuses" | "pay";

// ← Change this to whatever PIN you want
const PAY_PIN = "1234";

interface BonusEmployee {
  employee_id: number;
  name: string;
  total: number;
  days_qualified: number;
}

interface BonusDaily {
  date: string;
  pool: number;
  present_count: number;
  per_share: number;
  present_employee_ids: number[];
}

interface CommissionDetail {
  date: string;
  services: string;
  bill_total: number;
  commission: number;
  performers: number;
  per_share: number;
}

interface BonusCommission {
  name: string;
  total: number;
  days_qualified: number;
  details: CommissionDetail[];
}

interface BonusMonth {
  month: string;
  paid: boolean;
  paid_at?: string;
  employees: BonusEmployee[];
  daily: BonusDaily[];
  grand_total: number;
  total_pool: number;
  days_with_eyebrows: number;
  commissions: BonusCommission[];
  commission_total: number;
  month_revenue: number;
  total_salaries: number;
}

interface HistoryMonth {
  month: string;
  total: number;
  employee_count: number;
  paid_at: string;
}

// Returns "present" if within 10-min grace period, "late" otherwise
function determineStatus(checkInTime: string, shiftStart: string): "present" | "late" {
  if (!checkInTime || !shiftStart) return "present";
  const [ch, cm] = checkInTime.split(":").map(Number);
  const [sh, sm] = shiftStart.split(":").map(Number);
  return (ch * 60 + cm) <= (sh * 60 + sm + 10) ? "present" : "late";
}

const absenceOptions = [
  { value: "absent", label: "Absent", color: "bg-red-100 text-red-700" },
  { value: "leave", label: "Leave", color: "bg-blue-100 text-blue-700" },
  { value: "uninformed", label: "Uninformed", color: "bg-gray-200 text-gray-700" },
];

const statusColors: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  late: "bg-yellow-100 text-yellow-700",
  absent: "bg-red-100 text-red-700",
  leave: "bg-blue-100 text-blue-700",
  uninformed: "bg-gray-200 text-gray-700",
};

function parse24To12(t: string): { h: number; m: number; period: "AM" | "PM" } {
  if (!t) {
    const now = new Date();
    const hh = now.getHours();
    return { h: hh === 0 ? 12 : hh > 12 ? hh - 12 : hh, m: now.getMinutes(), period: hh >= 12 ? "PM" : "AM" };
  }
  const [hh, mm] = t.split(":").map(Number);
  return { h: hh === 0 ? 12 : hh > 12 ? hh - 12 : hh, m: mm, period: hh >= 12 ? "PM" : "AM" };
}

function parts12To24(h: number, m: number, period: "AM" | "PM"): string {
  let h24 = h;
  if (period === "AM" && h === 12) h24 = 0;
  else if (period === "PM" && h !== 12) h24 = h + 12;
  return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function format12(t: string): string {
  if (!t) return "";
  const { h, m, period } = parse24To12(t);
  return `${h}:${String(m).padStart(2, "0")} ${period}`;
}

function TimeInput12({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = parse24To12(value);
  return (
    <div className="flex items-center gap-0.5">
      <select
        value={parts.h}
        onChange={(e) => onChange(parts12To24(Number(e.target.value), parts.m, parts.period))}
        className="px-1.5 py-1 rounded border border-gray-200 text-sm focus:border-gold outline-none"
      >
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
      <span className="text-gray-400 text-xs px-0.5">:</span>
      <select
        value={parts.m}
        onChange={(e) => onChange(parts12To24(parts.h, Number(e.target.value), parts.period))}
        className="px-1.5 py-1 rounded border border-gray-200 text-sm focus:border-gold outline-none"
      >
        {Array.from({ length: 60 }, (_, i) => (
          <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
        ))}
      </select>
      <select
        value={parts.period}
        onChange={(e) => onChange(parts12To24(parts.h, parts.m, e.target.value as "AM" | "PM"))}
        className="px-1.5 py-1 rounded border border-gray-200 text-sm focus:border-gold outline-none"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export default function StaffPage() {
  const [tab, setTab] = useState<Tab>("attendance");
  const { toast } = useToast();

  // Team state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deactivating, setDeactivating] = useState<Employee | null>(null);
  const [empForm, setEmpForm] = useState({
    name: "", phone: "", shift_start: "11:00", sunday_shift_start: "",
  });

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [checkInTimes, setCheckInTimes] = useState<Record<number, string>>({});

  // Pay tab state
  const [payUnlocked, setPayUnlocked] = useState(false);
  const [payPinInput, setPayPinInput] = useState("");
  const [payPinError, setPayPinError] = useState(false);
  const [editingSalaryId, setEditingSalaryId] = useState<number | null>(null);
  const [salaryInput, setSalaryInput] = useState("");

  // Bonuses state
  const [bonusMonth, setBonusMonth] = useState(new Date().toISOString().slice(0, 7));
  const [bonusData, setBonusData] = useState<BonusMonth | null>(null);
  const [bonusHistory, setBonusHistory] = useState<HistoryMonth[]>([]);
  const [showDaily, setShowDaily] = useState(false);
  const [expandedCommission, setExpandedCommission] = useState<string | null>(null);
  const [confirmPayout, setConfirmPayout] = useState(false);

  // Load employees
  const loadEmployees = async () => {
    const res = await fetch("/api/employees?all=true");
    const data = await res.json();
    setEmployees(data);
  };

  // Load attendance
  const loadAttendance = async () => {
    const res = await fetch(`/api/attendance?date=${attendanceDate}`);
    const data = await res.json();
    setAttendance(data.attendance);
    setSummary(data.summary);
    // Pre-fill time inputs: use existing check_in_time if already marked, else current time
    const now = new Date();
    const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setCheckInTimes((prev) => {
      const next = { ...prev };
      (data.attendance as AttendanceRow[]).forEach((row) => {
        next[row.employee_id] = row.check_in_time || next[row.employee_id] || nowStr;
      });
      return next;
    });
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [attendanceDate]);

  // Load bonus data for the selected month
  const loadBonus = async () => {
    const res = await fetch(`/api/bonuses?month=${bonusMonth}`);
    const data = await res.json();
    setBonusData(data);
  };

  // Load history of paid months
  const loadHistory = async () => {
    const res = await fetch(`/api/bonuses?history=true`);
    const data = await res.json();
    setBonusHistory(data.months || []);
  };

  useEffect(() => {
    if (tab === "bonuses") {
      loadBonus();
      loadHistory();
    }
  }, [tab, bonusMonth]);

  const payoutMonth = async () => {
    const res = await fetch("/api/bonuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: bonusMonth }),
    });
    if (res.ok) {
      const data = await res.json();
      toast(`Paid out Rs. ${data.grand_total.toLocaleString()} to ${data.employee_count} employees`);
      setConfirmPayout(false);
      loadBonus();
      loadHistory();
    } else {
      const err = await res.json();
      toast(err.error || "Failed to pay out", "error");
      setConfirmPayout(false);
    }
  };

  // Format YYYY-MM as "May 2026"
  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const isCurrentMonth = bonusMonth === currentMonth;

  // Team actions
  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(empForm),
    });
    if (res.ok) {
      toast("Employee added");
      setEmpForm({ name: "", phone: "", shift_start: "11:00", sunday_shift_start: "" });
      setShowAddEmployee(false);
      loadEmployees();
      loadAttendance();
    } else {
      toast("Failed to add employee", "error");
    }
  };

  const saveEditEmployee = async () => {
    if (!editingEmployee) return;
    const res = await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingEmployee.id,
        name: empForm.name,
        phone: empForm.phone,
        shift_start: empForm.shift_start,
        sunday_shift_start: empForm.sunday_shift_start || null,
      }),
    });
    if (res.ok) {
      toast("Employee updated");
      setEditingEmployee(null);
      loadEmployees();
      loadAttendance();
    } else {
      toast("Failed to update", "error");
    }
  };

  const deactivateEmployee = async (emp: Employee) => {
    const res = await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: emp.id, active: emp.active ? 0 : 1 }),
    });
    if (res.ok) {
      toast(emp.active ? "Employee deactivated" : "Employee reactivated");
      setDeactivating(null);
      loadEmployees();
      loadAttendance();
    }
  };

  // Pay tab actions
  const submitPin = () => {
    if (payPinInput === PAY_PIN) {
      setPayUnlocked(true);
      setPayPinError(false);
      setPayPinInput("");
    } else {
      setPayPinError(true);
      setPayPinInput("");
      setTimeout(() => setPayPinError(false), 1500);
    }
  };

  const saveSalary = async (emp: Employee) => {
    const salary = parseInt(salaryInput) || 0;
    await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: emp.id, salary }),
    });
    toast(`Salary updated for ${emp.name}`);
    setEditingSalaryId(null);
    loadEmployees();
  };

  // Attendance actions
  const markAttendance = async (employeeId: number, status: string) => {
    const now = new Date();
    const fallback = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const checkInTime = checkInTimes[employeeId] || fallback;

    // Optimistic update — reflect instantly, no waiting for network
    const updated = attendance.map((row) =>
      row.employee_id === employeeId
        ? { ...row, status, check_in_time: (status === "present" || status === "late") ? checkInTime : null }
        : row
    );
    setAttendance(updated);
    const counts = { present: 0, late: 0, absent: 0, leave: 0, uninformed: 0, unmarked: 0 };
    updated.forEach((r) => {
      if (!r.status) counts.unmarked++;
      else if (r.status in counts) (counts as Record<string, number>)[r.status]++;
    });
    setSummary({ total: updated.length, ...counts });

    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: employeeId,
        date: attendanceDate,
        status,
        check_in_time: (status === "present" || status === "late") ? checkInTime : null,
      }),
    });
    if (!res.ok) {
      toast("Failed to mark attendance", "error");
      loadAttendance(); // revert on failure
    }
  };

  const isLateHint = (shiftStart: string): boolean => {
    const now = new Date();
    const [h, m] = shiftStart.split(":").map(Number);
    const shiftTime = new Date();
    shiftTime.setHours(h, m, 0);
    return now > shiftTime;
  };

  const isToday = attendanceDate === new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!deactivating}
        title={deactivating?.active ? "Deactivate Employee" : "Reactivate Employee"}
        message={`${deactivating?.active ? "Deactivate" : "Reactivate"} ${deactivating?.name}?`}
        confirmLabel={deactivating?.active ? "Deactivate" : "Reactivate"}
        confirmColor={deactivating?.active ? "red" : "green"}
        onConfirm={() => deactivating && deactivateEmployee(deactivating)}
        onCancel={() => setDeactivating(null)}
      />

      {/* Edit employee modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingEmployee(null)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">
              Edit Employee
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
                <input
                  type="text"
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={empForm.phone}
                  onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Shift Start (Mon–Sat)</label>
                <TimeInput12
                  value={empForm.shift_start}
                  onChange={(v) => setEmpForm({ ...empForm, shift_start: v })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Sunday Shift (optional)</label>
                <TimeInput12
                  value={empForm.sunday_shift_start}
                  onChange={(v) => setEmpForm({ ...empForm, sunday_shift_start: v })}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setEditingEmployee(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button onClick={saveEditEmployee} className="btn-gold py-2 px-5 text-sm">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab("attendance")}
            className={`flex-shrink-0 px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "attendance" ? "bg-gold text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setTab("team")}
            className={`flex-shrink-0 px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "team" ? "bg-gold text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Team
          </button>
          <button
            onClick={() => setTab("bonuses")}
            className={`flex-shrink-0 px-5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === "bonuses" ? "bg-gold text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Bonuses
          </button>
          <button
            onClick={() => setTab("pay")}
            className={`flex-shrink-0 px-5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === "pay" ? "bg-gold text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Pay
          </button>
        </div>
      </div>

      {/* ===== ATTENDANCE TAB ===== */}
      {tab === "attendance" && (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
              <div className="bg-white rounded-lg border border-gray-100 p-2 sm:p-4 text-center col-span-1">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Total</p>
                <p className="text-lg sm:text-2xl font-bold text-charcoal">{summary.total}</p>
              </div>
              <div className="bg-green-50 rounded-lg border border-green-100 p-2 sm:p-4 text-center">
                <p className="text-[10px] sm:text-xs text-green-600 uppercase">Present</p>
                <p className="text-lg sm:text-2xl font-bold text-green-700">{summary.present}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg border border-yellow-100 p-2 sm:p-4 text-center">
                <p className="text-[10px] sm:text-xs text-yellow-600 uppercase">Late</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-700">{summary.late}</p>
              </div>
              <div className="bg-red-50 rounded-lg border border-red-100 p-2 sm:p-4 text-center">
                <p className="text-[10px] sm:text-xs text-red-600 uppercase">Absent</p>
                <p className="text-lg sm:text-2xl font-bold text-red-700">{summary.absent}</p>
              </div>
              <div className="bg-blue-50 rounded-lg border border-blue-100 p-2 sm:p-4 text-center">
                <p className="text-[10px] sm:text-xs text-blue-600 uppercase">Leave</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-700">{summary.leave}</p>
              </div>
              <div className="bg-gray-100 rounded-lg border border-gray-200 p-2 sm:p-4 text-center">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Uninformed</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-600">{summary.uninformed}</p>
              </div>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 sm:p-4 text-center">
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Unmarked</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-600">{summary.unmarked}</p>
              </div>
            </div>
          )}

          {/* Date picker */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-4">
              <label className="text-xs font-medium text-gray-500 uppercase">Date</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
              />
              {!isToday && (
                <button
                  onClick={() => setAttendanceDate(new Date().toISOString().split("T")[0])}
                  className="text-sm text-gold hover:text-gold-dark font-medium"
                >
                  Go to Today
                </button>
              )}
            </div>
          </div>

          {/* Attendance list — table (desktop) */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Shift</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Check-in</th>
                    <th className="px-6 py-3">Mark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        No employees yet. Add team members in the Team tab.
                      </td>
                    </tr>
                  ) : (
                    attendance.map((row) => {
                      const lateHint = isToday && !row.status && isLateHint(row.shift_start);

                      return (
                        <tr key={row.employee_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-charcoal">{row.name}</p>
                            <p className="text-xs text-gray-400">{row.phone}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{format12(row.shift_start)}</td>
                          <td className="px-6 py-4">
                            {row.status ? (
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[row.status] || "bg-gray-100 text-gray-600"}`}>
                                {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">
                                {lateHint ? <span className="text-yellow-600 font-medium">Shift started</span> : "Not marked"}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <TimeInput12
                              value={checkInTimes[row.employee_id] || ""}
                              onChange={(v) => setCheckInTimes((prev) => ({ ...prev, [row.employee_id]: v }))}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1 flex-wrap">
                              {/* Auto-detect present/late based on time + grace period */}
                              <button
                                onClick={() => markAttendance(row.employee_id, determineStatus(checkInTimes[row.employee_id] || "", row.shift_start))}
                                className={`text-xs px-2 py-1 rounded transition-colors ${
                                  row.status === "present" ? "bg-green-100 text-green-700 font-bold ring-1 ring-green-400"
                                  : row.status === "late" ? "bg-yellow-100 text-yellow-700 font-bold ring-1 ring-yellow-400"
                                  : "bg-green-50 text-green-700 hover:bg-green-100"
                                }`}
                              >
                                {row.status === "present" ? "Present ✓" : row.status === "late" ? "Late ✓" : "Check In"}
                              </button>
                              {absenceOptions.map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => markAttendance(row.employee_id, opt.value)}
                                  className={`text-xs px-2 py-1 rounded transition-colors ${
                                    row.status === opt.value
                                      ? opt.color + " font-bold ring-1 ring-current"
                                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Attendance list — cards (mobile) */}
          <div className="md:hidden space-y-3">
            {attendance.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">
                No employees yet. Add team members in the Team tab.
              </div>
            ) : (
              attendance.map((row) => {
                const lateHint = isToday && !row.status && isLateHint(row.shift_start);

                return (
                  <div key={row.employee_id} className="bg-white rounded-lg border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-charcoal truncate">{row.name}</p>
                        <p className="text-xs text-gray-400">{row.phone}</p>
                        <p className="text-xs text-gray-500 mt-1">Shift: {format12(row.shift_start)}{row.check_in_time && ` · In: ${format12(row.check_in_time)}`}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {row.status ? (
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[row.status] || "bg-gray-100 text-gray-600"}`}>
                            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {lateHint ? <span className="text-yellow-600 font-medium">Late</span> : "—"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-xs text-gray-400 flex-shrink-0">Time in:</label>
                      <TimeInput12
                        value={checkInTimes[row.employee_id] || ""}
                        onChange={(v) => setCheckInTimes((prev) => ({ ...prev, [row.employee_id]: v }))}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        onClick={() => markAttendance(row.employee_id, determineStatus(checkInTimes[row.employee_id] || "", row.shift_start))}
                        className={`text-[11px] px-1 py-1.5 rounded transition-colors text-center ${
                          row.status === "present" ? "bg-green-100 text-green-700 font-bold ring-1 ring-green-400"
                          : row.status === "late" ? "bg-yellow-100 text-yellow-700 font-bold ring-1 ring-yellow-400"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {row.status === "present" ? "Present ✓" : row.status === "late" ? "Late ✓" : "Check In"}
                      </button>
                      {absenceOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => markAttendance(row.employee_id, opt.value)}
                          className={`text-[11px] px-1 py-1.5 rounded transition-colors text-center ${
                            row.status === opt.value
                              ? opt.color + " font-bold ring-1 ring-current"
                              : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ===== TEAM TAB ===== */}
      {tab === "team" && (
        <>
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{employees.filter((e) => e.active).length} active employee(s)</span>
              <button
                onClick={() => {
                  setShowAddEmployee(!showAddEmployee);
                  setEmpForm({ name: "", phone: "", shift_start: "11:00", sunday_shift_start: "" });
                }}
                className="btn-gold text-sm py-2"
              >
                + Add Employee
              </button>
            </div>
          </div>

          {/* Add form */}
          {showAddEmployee && (
            <form onSubmit={addEmployee} className="bg-white rounded-lg border border-gray-100 p-6">
              <h3 className="font-heading text-lg font-semibold mb-4">New Employee</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Name *"
                  required
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="px-4 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
                />
                <input
                  type="tel"
                  placeholder="Phone *"
                  required
                  value={empForm.phone}
                  onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                  className="px-4 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
                />
                <TimeInput12
                  value={empForm.shift_start}
                  onChange={(v) => setEmpForm({ ...empForm, shift_start: v })}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn-gold text-sm py-2">Add Employee</button>
                <button type="button" onClick={() => setShowAddEmployee(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Employee table — desktop */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Shift Start</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        No employees yet
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.id} className={`hover:bg-gray-50 ${!emp.active ? "opacity-50" : ""}`}>
                        <td className="px-6 py-4 text-sm font-medium text-charcoal">{emp.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{emp.phone}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{format12(emp.shift_start)}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1.5 flex-wrap">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              emp.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                            }`}>
                              {emp.active ? "Active" : "Inactive"}
                            </span>
                            {!emp.bonus_eligible && (
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-600">
                                No Bonus
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingEmployee(emp);
                                setEmpForm({
                                  name: emp.name,
                                  phone: emp.phone,
                                  shift_start: emp.shift_start,
                                  sunday_shift_start: emp.sunday_shift_start || "",
                                });
                              }}
                              className="text-xs text-gold hover:text-gold-dark font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeactivating(emp)}
                              className={`text-xs font-medium ${
                                emp.active ? "text-red-400 hover:text-red-600" : "text-green-500 hover:text-green-700"
                              }`}
                            >
                              {emp.active ? "Deactivate" : "Reactivate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Employee list — mobile cards */}
          <div className="md:hidden space-y-3">
            {employees.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">
                No employees yet
              </div>
            ) : (
              employees.map((emp) => (
                <div key={emp.id} className={`bg-white rounded-lg border border-gray-100 p-4 ${!emp.active ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-charcoal truncate">{emp.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{emp.phone}</p>
                      <p className="text-xs text-gray-400 mt-1">Shift: {format12(emp.shift_start)}{emp.sunday_shift_start ? ` · Sun: ${format12(emp.sunday_shift_start)}` : ""}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        emp.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                      }`}>
                        {emp.active ? "Active" : "Inactive"}
                      </span>
                      {!emp.bonus_eligible && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-600">
                          No Bonus
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditingEmployee(emp);
                        setEmpForm({ name: emp.name, phone: emp.phone, shift_start: emp.shift_start, sunday_shift_start: emp.sunday_shift_start || "" });
                      }}
                      className="text-xs text-gold hover:text-gold-dark font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeactivating(emp)}
                      className={`text-xs font-medium ${
                        emp.active ? "text-red-400 hover:text-red-600" : "text-green-500 hover:text-green-700"
                      }`}
                    >
                      {emp.active ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ===== PAY TAB ===== */}
      {tab === "pay" && (
        <>
          {!payUnlocked ? (
            /* ── PIN gate ── */
            <div className="flex items-center justify-center py-16">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 w-full max-w-xs text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${payPinError ? "bg-red-100" : "bg-gold/10"}`}>
                  <svg className={`w-7 h-7 transition-colors ${payPinError ? "text-red-500" : "text-gold"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h3 className="font-heading text-lg font-semibold text-charcoal mb-1">Finance — Restricted</h3>
                <p className="text-xs text-gray-400 mb-6">Enter the access code to view salaries & bonuses</p>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={payPinInput}
                  onChange={(e) => setPayPinInput(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && submitPin()}
                  placeholder="••••"
                  className={`w-full text-center text-xl tracking-[0.5em] px-4 py-3 rounded-lg border text-charcoal outline-none mb-4 transition-colors ${
                    payPinError ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-gold"
                  }`}
                />
                {payPinError && (
                  <p className="text-xs text-red-500 mb-3">Incorrect code. Try again.</p>
                )}
                <button
                  onClick={submitPin}
                  className="btn-gold w-full py-2.5 text-sm"
                >
                  Unlock
                </button>
              </div>
            </div>
          ) : (
            /* ── Pay content (unlocked) ── */
            <>
              {/* Header with lock button */}
              <div className="bg-white rounded-lg border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-charcoal">Staff Salaries</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Monthly payroll: <span className="font-medium text-charcoal">
                      Rs. {employees.filter(e => e.active).reduce((s, e) => s + (e.salary || 0), 0).toLocaleString()}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => { setPayUnlocked(false); setTab("attendance"); }}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors border border-gray-200 rounded-md px-3 py-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Lock
                </button>
              </div>

              {/* Salary cards */}
              {employees.filter(e => e.active).length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">
                  No active employees. Add staff in the Team tab first.
                </div>
              ) : (
                <div className="space-y-3">
                  {employees.filter(e => e.active).map((emp) => (
                    <div key={emp.id} className="bg-white rounded-lg border border-gray-100 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-charcoal">{emp.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{emp.phone} · {emp.role}</p>
                        </div>

                        {editingSalaryId === emp.id ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm text-gray-500">Rs.</span>
                            <input
                              type="number"
                              min={0}
                              value={salaryInput}
                              onChange={(e) => setSalaryInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveSalary(emp)}
                              autoFocus
                              className="w-28 px-3 py-1.5 rounded-md border border-gold text-sm outline-none text-charcoal"
                            />
                            <button onClick={() => saveSalary(emp)} className="text-xs bg-gold text-white px-3 py-1.5 rounded-md font-medium hover:bg-gold/90">
                              Save
                            </button>
                            <button onClick={() => setEditingSalaryId(null)} className="text-xs text-gray-400 hover:text-gray-600">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <p className="text-base font-bold text-charcoal">
                              {emp.salary ? `Rs. ${emp.salary.toLocaleString()}` : <span className="text-gray-400 font-normal text-sm">Not set</span>}
                            </p>
                            <button
                              onClick={() => { setEditingSalaryId(emp.id); setSalaryInput(String(emp.salary || "")); }}
                              className="text-xs text-gold hover:text-gold-dark font-medium border border-gold/30 rounded px-2 py-1"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-charcoal">Total Monthly Payroll</p>
                    <p className="text-xl font-bold text-gold">
                      Rs. {employees.filter(e => e.active).reduce((s, e) => s + (e.salary || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ===== BONUSES TAB ===== */}
      {tab === "bonuses" && (
        <>
          {!payUnlocked ? (
            /* ── PIN gate (shared with Pay) ── */
            <div className="flex items-center justify-center py-16">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 w-full max-w-xs text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${payPinError ? "bg-red-100" : "bg-gold/10"}`}>
                  <svg className={`w-7 h-7 transition-colors ${payPinError ? "text-red-500" : "text-gold"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h3 className="font-heading text-lg font-semibold text-charcoal mb-1">Finance — Restricted</h3>
                <p className="text-xs text-gray-400 mb-6">Enter the access code to view salaries & bonuses</p>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={payPinInput}
                  onChange={(e) => setPayPinInput(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && submitPin()}
                  placeholder="••••"
                  className={`w-full text-center text-xl tracking-[0.5em] px-4 py-3 rounded-lg border text-charcoal outline-none mb-4 transition-colors ${
                    payPinError ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-gold"
                  }`}
                />
                {payPinError && (
                  <p className="text-xs text-red-500 mb-3">Incorrect code. Try again.</p>
                )}
                <button onClick={submitPin} className="btn-gold w-full py-2.5 text-sm">
                  Unlock
                </button>
              </div>
            </div>
          ) : (
          <>
          <ConfirmDialog
            open={confirmPayout}
            title="Pay Out & Reset Month"
            message={`Pay out Rs. ${bonusData?.grand_total?.toLocaleString() || 0} to ${bonusData?.employees?.length || 0} employees for ${formatMonth(bonusMonth)}? This freezes the amounts in history and starts a fresh tally.`}
            confirmLabel="Pay & Lock"
            confirmColor="green"
            onConfirm={payoutMonth}
            onCancel={() => setConfirmPayout(false)}
          />

          {/* Month picker */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-xs font-medium text-gray-500 uppercase">Month</label>
              <input
                type="month"
                value={bonusMonth}
                onChange={(e) => setBonusMonth(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
              />
              {!isCurrentMonth && (
                <button
                  onClick={() => setBonusMonth(currentMonth)}
                  className="text-sm text-gold hover:text-gold-dark font-medium"
                >
                  Go to Current Month
                </button>
              )}
              {bonusData?.paid && (
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                  ✓ Paid Out
                </span>
              )}
              <button
                onClick={() => { setPayUnlocked(false); setTab("attendance"); }}
                className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors border border-gray-200 rounded-md px-3 py-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Lock
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              <span className="font-medium text-gray-500">Eyebrow pool:</span> charges from eyebrow services split equally among staff marked <span className="text-green-600 font-medium">Present</span> or Leave that day. &nbsp;
              <span className="font-medium text-gray-500">Commissions:</span> 5% of all other service revenue split equally among all present/leave staff that day.
            </p>
          </div>

          {/* Summary cards */}
          {bonusData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-lg border border-gold/20 p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">Eyebrow Pool</p>
                <p className="text-2xl font-bold text-charcoal">Rs. {bonusData.grand_total.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">{bonusData.days_with_eyebrows || 0} days</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-50/50 rounded-lg border border-purple-100 p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">Service Commissions</p>
                <p className="text-2xl font-bold text-charcoal">Rs. {(bonusData.commission_total ?? 0).toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">5% on non-eyebrow</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">Days With Eyebrows</p>
                <p className="text-2xl font-bold text-charcoal">{bonusData.days_with_eyebrows || (bonusData.paid ? "—" : 0)}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 p-4 flex items-center justify-center">
                {bonusData.paid ? (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase mb-1">Paid On</p>
                    <p className="text-sm font-medium text-charcoal">
                      {bonusData.paid_at ? new Date(bonusData.paid_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                ) : bonusData.employees.length > 0 ? (
                  <button
                    onClick={() => setConfirmPayout(true)}
                    className="btn-gold text-sm py-2 px-4 w-full"
                    disabled={isCurrentMonth}
                    title={isCurrentMonth ? "Wait until month is over to pay out" : "Pay out and lock this month"}
                  >
                    {isCurrentMonth ? "Current Month — Wait" : "Pay & Lock Month"}
                  </button>
                ) : (
                  <p className="text-xs text-gray-400 text-center">No bonus to pay</p>
                )}
              </div>
            </div>
          )}

          {/* Net Profit Summary */}
          {bonusData && (bonusData.month_revenue > 0 || bonusData.total_salaries > 0) && (
            <div className="bg-white rounded-lg border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-charcoal mb-3">Monthly Net Estimate</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Revenue</span>
                  <span className="font-medium text-green-600">Rs. {(bonusData.month_revenue ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">− Salaries</span>
                  <span className="text-red-500">Rs. {(bonusData.total_salaries ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">− Eyebrow Bonuses</span>
                  <span className="text-red-500">Rs. {(bonusData.grand_total ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">− Service Commissions</span>
                  <span className="text-red-500">Rs. {(bonusData.commission_total ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 mt-2">
                  <span className="text-charcoal">Net (before other costs)</span>
                  <span className={
                    (bonusData.month_revenue - bonusData.total_salaries - bonusData.grand_total - (bonusData.commission_total ?? 0)) >= 0
                      ? "text-green-600" : "text-red-600"
                  }>
                    Rs. {(bonusData.month_revenue - bonusData.total_salaries - bonusData.grand_total - (bonusData.commission_total ?? 0)).toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-3">Excludes rent, products, and other expenses not tracked here.</p>
            </div>
          )}

          {/* Eyebrow Pool — per-employee table */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-heading text-sm font-semibold text-charcoal uppercase tracking-wider">
                Eyebrow Pool — {bonusData?.paid ? "Final Payouts" : "Running Tally"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Split equally among all present/leave staff on days eyebrow services were done</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50/50">
                    <th className="px-6 py-3">Employee</th>
                    <th className="px-6 py-3">Days Qualified</th>
                    <th className="px-6 py-3 text-right">Pool Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {!bonusData || bonusData.employees.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                        No eyebrow pool earned for {formatMonth(bonusMonth)} yet
                      </td>
                    </tr>
                  ) : (
                    bonusData.employees.map((emp) => (
                      <tr key={emp.employee_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-charcoal">{emp.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{emp.days_qualified} day(s)</td>
                        <td className="px-6 py-4 text-sm font-semibold text-charcoal text-right">
                          Rs. {emp.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Service Commissions — 5% split equally among all staff */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-heading text-sm font-semibold text-charcoal uppercase tracking-wider">
                Service Commissions (5%)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">5% of all non-eyebrow service revenue, split equally among all present/leave staff that day. Click a name to see breakdown.</p>
            </div>
            <div>
              {!bonusData || (bonusData.commissions ?? []).length === 0 ? (
                <p className="px-6 py-12 text-center text-gray-400 text-sm">
                  No service commissions for {formatMonth(bonusMonth)} yet
                </p>
              ) : (
                (bonusData.commissions ?? []).map((c) => (
                  <div key={c.name} className="border-b border-gray-50 last:border-0">
                    <button
                      type="button"
                      onClick={() => setExpandedCommission(expandedCommission === c.name ? null : c.name)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-charcoal">{c.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.days_qualified} day(s) with service revenue</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-purple-700">
                          Rs. {c.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-gray-400">{expandedCommission === c.name ? "▲" : "▼"}</span>
                      </div>
                    </button>
                    {expandedCommission === c.name && (
                      <div className="bg-purple-50/40 px-6 pb-4 overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-gray-500 uppercase tracking-wider border-b border-purple-100">
                              <th className="py-2 pr-4">Date</th>
                              <th className="py-2 pr-4">Services</th>
                              <th className="py-2 pr-4 text-right">Bill Total</th>
                              <th className="py-2 pr-4 text-right">5% Commission</th>
                              <th className="py-2 pr-4 text-right">Split</th>
                              <th className="py-2 text-right">Their Share</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-purple-100/50">
                            {c.details.map((d, i) => (
                              <tr key={i} className="text-charcoal">
                                <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">{d.date}</td>
                                <td className="py-2 pr-4 text-gray-600">{d.services}</td>
                                <td className="py-2 pr-4 text-right whitespace-nowrap">Rs. {d.bill_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="py-2 pr-4 text-right text-gray-500 whitespace-nowrap">Rs. {d.commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="py-2 pr-4 text-right text-gray-400 whitespace-nowrap">{d.performers > 1 ? `÷${d.performers}` : "—"}</td>
                                <td className="py-2 text-right font-semibold text-purple-700 whitespace-nowrap">
                                  Rs. {d.per_share.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-purple-200">
                              <td colSpan={5} className="pt-2 text-right font-semibold text-gray-600">Total:</td>
                              <td className="pt-2 text-right font-bold text-purple-700">
                                Rs. {c.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Daily breakdown (only for unpaid/live months) */}
          {bonusData && !bonusData.paid && bonusData.daily.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <button
                onClick={() => setShowDaily(!showDaily)}
                className="w-full px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-heading text-sm font-semibold text-charcoal uppercase tracking-wider">
                  Daily Breakdown ({bonusData.daily.length} day{bonusData.daily.length === 1 ? "" : "s"})
                </h3>
                <span className="text-xs text-gray-400">{showDaily ? "Hide" : "Show"}</span>
              </button>
              {showDaily && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50/50">
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3 text-right">Eyebrow Pool</th>
                        <th className="px-6 py-3 text-center">Present</th>
                        <th className="px-6 py-3 text-right">Per Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bonusData.daily.map((d) => (
                        <tr key={d.date} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm text-charcoal">{formatDate(d.date)}</td>
                          <td className="px-6 py-3 text-sm text-gray-600 text-right">Rs. {d.pool.toLocaleString()}</td>
                          <td className="px-6 py-3 text-sm text-gray-600 text-center">
                            {d.present_count === 0 ? (
                              <span className="text-red-500">0 (forfeit)</span>
                            ) : (
                              d.present_count
                            )}
                          </td>
                          <td className="px-6 py-3 text-sm text-charcoal text-right">
                            {d.per_share > 0 ? `Rs. ${d.per_share.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* History */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-heading text-sm font-semibold text-charcoal uppercase tracking-wider">
                Payout History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50/50">
                    <th className="px-6 py-3">Month</th>
                    <th className="px-6 py-3">Employees Paid</th>
                    <th className="px-6 py-3">Paid On</th>
                    <th className="px-6 py-3 text-right">Total Paid</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bonusHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        No payouts yet
                      </td>
                    </tr>
                  ) : (
                    bonusHistory.map((h) => (
                      <tr key={h.month} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-charcoal">{formatMonth(h.month)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{h.employee_count} employees</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(h.paid_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-charcoal text-right">
                          Rs. {h.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setBonusMonth(h.month)}
                            className="text-xs text-gold hover:text-gold-dark font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </>
      )}
    </div>
  );
}
