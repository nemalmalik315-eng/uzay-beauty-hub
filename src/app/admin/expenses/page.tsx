"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/admin/Toast";

const CATEGORIES = [
  { key: "electricity", label: "Electricity", icon: "⚡", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { key: "inventory", label: "Inventory", icon: "📦", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "makeup", label: "Makeup / Products", icon: "💄", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { key: "rent", label: "Rent", icon: "🏠", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { key: "salary", label: "Staff Salary", icon: "💰", color: "bg-green-50 text-green-700 border-green-200" },
  { key: "other", label: "Other", icon: "📝", color: "bg-gray-50 text-gray-700 border-gray-200" },
];

const PAY_PIN = "1122";

interface Expense {
  id: number;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function currentMonth() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

export default function ExpensesPage() {
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonth);

  const [showAdd, setShowAdd] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState({ category: "electricity", description: "", amount: "", expense_date: todayStr() });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      if (sessionStorage.getItem("expensesPinOk") === "1") setPinUnlocked(true);
    } catch {}
  }, []);

  const handlePin = () => {
    if (pin === PAY_PIN) {
      setPinUnlocked(true);
      try { sessionStorage.setItem("expensesPinOk", "1"); } catch {}
    } else {
      setPinError(true);
      setPin("");
      setTimeout(() => setPinError(false), 1500);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [expRes, billRes] = await Promise.all([
      fetch(`/api/expenses?month=${month}`),
      fetch(`/api/billing?month=${month}`),
    ]);
    const expData = await expRes.json().catch(() => ({}));
    const billData = await billRes.json().catch(() => ({}));
    setExpenses(Array.isArray(expData.expenses) ? expData.expenses : []);
    setMonthRevenue(Number(billData.summary?.total_revenue) || 0);
    setLoading(false);
  };

  useEffect(() => {
    if (pinUnlocked) loadData();
  }, [pinUnlocked, month]);

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = monthRevenue - totalExpenses;

  const catMap = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

  const breakdown = CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses.filter((e) => e.category === cat.key).reduce((s, e) => s + Number(e.amount), 0),
  })).filter((c) => c.total > 0);

  const startAdd = () => {
    setEditingExpense(null);
    setForm({ category: "electricity", description: "", amount: "", expense_date: todayStr() });
    setShowAdd(true);
  };

  const startEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setForm({ category: exp.category, description: exp.description || "", amount: String(exp.amount), expense_date: exp.expense_date });
    setShowAdd(false);
  };

  const saveExpense = async () => {
    if (!form.amount || !form.expense_date) return;
    setSaving(true);
    const payload = {
      category: form.category,
      description: form.description || null,
      amount: parseFloat(form.amount),
      expense_date: form.expense_date,
    };
    const isEdit = !!editingExpense;
    const res = await fetch("/api/expenses", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { ...payload, id: editingExpense!.id } : payload),
    });
    if (res.ok) {
      toast(isEdit ? "Expense updated" : "Expense added");
      setShowAdd(false);
      setEditingExpense(null);
      setForm({ category: "electricity", description: "", amount: "", expense_date: todayStr() });
      loadData();
    } else {
      toast("Failed to save", "error");
    }
    setSaving(false);
  };

  const deleteExpense = async (id: number) => {
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    toast("Expense deleted");
    loadData();
  };

  /* ── PIN gate ── */
  if (!pinUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="font-heading text-lg font-semibold text-charcoal mb-1">Admin Only</h2>
          <p className="text-sm text-gray-400 mb-6">Enter your PIN to access expenses</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePin()}
            placeholder="••••"
            autoFocus
            className={`w-full text-center text-2xl tracking-[0.5em] px-4 py-3 rounded-xl border ${pinError ? "border-red-400 bg-red-50" : "border-gray-200"} outline-none focus:border-gold mb-3 font-mono`}
          />
          {pinError && <p className="text-xs text-red-500 mb-2">Incorrect PIN</p>}
          <button onClick={handlePin} className="btn-gold w-full mt-1">Unlock</button>
        </div>
      </div>
    );
  }

  /* ── Main page ── */
  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none bg-white"
        />
        <button
          onClick={startAdd}
          className="btn-gold text-sm py-2 ml-auto"
        >
          + Add Expense
        </button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-[11px] text-gray-400 mb-1">Revenue</p>
          <p className="text-base sm:text-lg font-bold text-green-600">Rs. {monthRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-[11px] text-gray-400 mb-1">Expenses</p>
          <p className="text-base sm:text-lg font-bold text-red-500">Rs. {totalExpenses.toLocaleString()}</p>
        </div>
        <div className={`rounded-2xl p-4 shadow-sm text-center ${netProfit >= 0 ? "bg-gold/10" : "bg-red-50"}`}>
          <p className="text-[11px] text-gray-400 mb-1">Net Profit</p>
          <p className={`text-base sm:text-lg font-bold ${netProfit >= 0 ? "text-gold" : "text-red-600"}`}>
            {netProfit < 0 ? "−" : ""}Rs. {Math.abs(netProfit).toLocaleString()}
          </p>
          {netProfit < 0 && <p className="text-[10px] text-red-400 mt-0.5">loss</p>}
        </div>
      </div>

      {/* Add / Edit form */}
      {(showAdd || editingExpense) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="font-heading text-base font-semibold">{editingExpense ? "Edit Expense" : "New Expense"}</h3>

          {/* Category picker */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setForm((f) => ({ ...f, category: cat.key }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.category === cat.key ? "bg-gold text-white border-gold shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-gold"
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Amount (Rs.) *</label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Date *</label>
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Note (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g. LESCO Oct bill, foundation & primer restock…"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveExpense}
              disabled={saving || !form.amount || !form.expense_date}
              className="btn-gold text-sm py-2 disabled:opacity-50"
            >
              {saving ? "Saving…" : editingExpense ? "Update" : "Add"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setEditingExpense(null); }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {!loading && breakdown.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Breakdown</h3>
          <div className="space-y-2.5">
            {breakdown.map((cat) => (
              <div key={cat.key} className="flex items-center gap-3">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${cat.color}`}>
                  {cat.icon} {cat.label}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gold h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-charcoal flex-shrink-0 tabular-nums">
                  Rs. {cat.total.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500">Total</span>
              <span className="text-sm font-bold text-red-500 tabular-nums">Rs. {totalExpenses.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Expense list */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">All Expenses</h3>
          {!loading && <span className="text-xs text-gray-400">{expenses.length} {expenses.length === 1 ? "entry" : "entries"}</span>}
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400">No expenses recorded for this month</p>
            <button onClick={startAdd} className="mt-3 text-sm text-gold hover:text-gold-dark font-medium">+ Add first expense</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {expenses.map((exp) => {
              const cat = catMap[exp.category] || catMap["other"];
              return (
                <div key={exp.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${cat.color}`}>
                    {cat.icon} {cat.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    {exp.description && (
                      <p className="text-sm text-charcoal truncate">{exp.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(exp.expense_date + "T00:00:00").toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-red-500 flex-shrink-0 tabular-nums">
                    Rs. {Number(exp.amount).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => startEdit(exp)}
                      className="text-xs text-gold hover:text-gold-dark px-2 py-1.5 rounded hover:bg-gold/5 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteExpense(exp.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1.5 rounded hover:bg-red-50 transition-colors"
                    >
                      Del
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
