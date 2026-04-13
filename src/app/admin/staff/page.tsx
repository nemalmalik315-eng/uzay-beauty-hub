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
  active: number;
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

type Tab = "team" | "attendance";

const statusOptions = [
  { value: "present", label: "Present", color: "bg-green-100 text-green-700" },
  { value: "late", label: "Late", color: "bg-yellow-100 text-yellow-700" },
  { value: "absent", label: "Absent", color: "bg-red-100 text-red-700" },
  { value: "leave", label: "Leave", color: "bg-blue-100 text-blue-700" },
  { value: "uninformed", label: "Uninformed", color: "bg-gray-200 text-gray-700" },
];

export default function StaffPage() {
  const [tab, setTab] = useState<Tab>("attendance");
  const { toast } = useToast();

  // Team state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deactivating, setDeactivating] = useState<Employee | null>(null);
  const [empForm, setEmpForm] = useState({
    name: "", phone: "", shift_start: "11:00",
  });

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);

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
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [attendanceDate]);

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
      setEmpForm({ name: "", phone: "", shift_start: "11:00" });
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

  // Attendance actions
  const markAttendance = async (employeeId: number, status: string) => {
    const now = new Date();
    const checkInTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

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
    if (res.ok) {
      loadAttendance();
    } else {
      toast("Failed to mark attendance", "error");
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
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
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
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Shift Start</label>
                <input
                  type="time"
                  value={empForm.shift_start}
                  onChange={(e) => setEmpForm({ ...empForm, shift_start: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
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
        <div className="flex gap-2">
          <button
            onClick={() => setTab("attendance")}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "attendance" ? "bg-gold text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Attendance
          </button>
          <button
            onClick={() => setTab("team")}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "team" ? "bg-gold text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Team
          </button>
        </div>
      </div>

      {/* ===== ATTENDANCE TAB ===== */}
      {tab === "attendance" && (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white rounded-lg border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-500 uppercase">Total</p>
                <p className="text-2xl font-bold text-charcoal">{summary.total}</p>
              </div>
              <div className="bg-green-50 rounded-lg border border-green-100 p-4 text-center">
                <p className="text-xs text-green-600 uppercase">Present</p>
                <p className="text-2xl font-bold text-green-700">{summary.present}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg border border-yellow-100 p-4 text-center">
                <p className="text-xs text-yellow-600 uppercase">Late</p>
                <p className="text-2xl font-bold text-yellow-700">{summary.late}</p>
              </div>
              <div className="bg-red-50 rounded-lg border border-red-100 p-4 text-center">
                <p className="text-xs text-red-600 uppercase">Absent</p>
                <p className="text-2xl font-bold text-red-700">{summary.absent}</p>
              </div>
              <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 text-center">
                <p className="text-xs text-blue-600 uppercase">Leave</p>
                <p className="text-2xl font-bold text-blue-700">{summary.leave}</p>
              </div>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
                <p className="text-xs text-gray-500 uppercase">Unmarked</p>
                <p className="text-2xl font-bold text-gray-600">{summary.unmarked}</p>
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

          {/* Attendance list */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
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
                      const currentStatus = statusOptions.find((s) => s.value === row.status);
                      const lateHint = isToday && !row.status && isLateHint(row.shift_start);

                      return (
                        <tr key={row.employee_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-charcoal">{row.name}</p>
                            <p className="text-xs text-gray-400">{row.phone}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{row.shift_start}</td>
                          <td className="px-6 py-4">
                            {currentStatus ? (
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${currentStatus.color}`}>
                                {currentStatus.label}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">
                                {lateHint ? (
                                  <span className="text-yellow-600 font-medium">Shift started</span>
                                ) : (
                                  "Not marked"
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {row.check_in_time || "—"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1 flex-wrap">
                              {statusOptions.map((opt) => (
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
                  setEmpForm({ name: "", phone: "", shift_start: "11:00" });
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
                <input
                  type="time"
                  value={empForm.shift_start}
                  onChange={(e) => setEmpForm({ ...empForm, shift_start: e.target.value })}
                  className="px-4 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
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

          {/* Employee table */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
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
                        <td className="px-6 py-4 text-sm text-gray-600">{emp.shift_start}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            emp.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                          }`}>
                            {emp.active ? "Active" : "Inactive"}
                          </span>
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
        </>
      )}
    </div>
  );
}
