"use client";

import { useState, useEffect } from "react";

interface Bill {
  id: number;
  customer_name: string;
  service_name: string;
  service_charge: number;
  discount: number;
  total: number;
  payment_method: string;
  created_at: string;
}

interface Summary {
  total_charges: number;
  total_discounts: number;
  total_revenue: number;
  total_transactions: number;
}

interface Service {
  id: number;
  name: string;
  price: number;
  category: string;
}

export default function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [period, setPeriod] = useState("today");
  const [showAdd, setShowAdd] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({
    customer_name: "",
    service_name: "",
    service_charge: 0,
    discount: 0,
    payment_method: "cash",
  });

  const loadBills = async () => {
    const res = await fetch(`/api/billing?period=${period}`);
    const data = await res.json();
    setBills(data.bills);
    setSummary(data.summary);
  };

  useEffect(() => {
    loadBills();
    fetch("/api/services")
      .then((r) => r.json())
      .then(setServices);
  }, [period]);

  const addBill = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ customer_name: "", service_name: "", service_charge: 0, discount: 0, payment_method: "cash" });
    setShowAdd(false);
    loadBills();
  };

  const handleServiceSelect = (serviceName: string) => {
    const service = services.find((s) => s.name === serviceName);
    setForm({
      ...form,
      service_name: serviceName,
      service_charge: service?.price || 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Charges</p>
            <p className="text-2xl font-bold text-charcoal mt-1">Rs. {summary.total_charges.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Discounts Given</p>
            <p className="text-2xl font-bold text-red-500 mt-1">-Rs. {summary.total_discounts.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Net Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-1">Rs. {summary.total_revenue.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Transactions</p>
            <p className="text-2xl font-bold text-charcoal mt-1">{summary.total_transactions}</p>
          </div>
        </div>
      )}

      {/* Period filter & Add */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {["today", "week", "month"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-gold text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="btn-gold text-sm py-2 ml-auto"
          >
            + Add Bill
          </button>
        </div>
      </div>

      {/* Add bill form */}
      {showAdd && (
        <form onSubmit={addBill} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">New Bill</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Customer Name *"
              required
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            />
            <select
              value={form.service_name}
              onChange={(e) => handleServiceSelect(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
              required
            >
              <option value="">Select Service *</option>
              {services.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} (Rs. {s.price})
                </option>
              ))}
            </select>
            <div>
              <input
                type="number"
                placeholder="Charge *"
                required
                min={0}
                step={0.01}
                value={form.service_charge || ""}
                onChange={(e) => setForm({ ...form, service_charge: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
              />
            </div>
            <input
              type="number"
              placeholder="Discount"
              min={0}
              step={0.01}
              value={form.discount || ""}
              onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            />
            <select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="online">Online Transfer</option>
            </select>
            <div className="flex items-center text-sm">
              <span className="text-gray-500">Total:</span>
              <span className="font-bold text-green-600 ml-2 text-lg">
                Rs. {(form.service_charge - form.discount).toFixed(0)}
              </span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-gold text-sm py-2">Save Bill</button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Bills table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Charge</th>
                <th className="px-6 py-3">Discount</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No bills for this period
                  </td>
                </tr>
              ) : (
                bills.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-400">{b.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">{b.customer_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.service_name}</td>
                    <td className="px-6 py-4 text-sm text-charcoal">Rs. {b.service_charge.toFixed(0)}</td>
                    <td className="px-6 py-4 text-sm text-red-500">
                      {b.discount > 0 ? `-Rs. ${b.discount.toFixed(0)}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">Rs. {b.total.toFixed(0)}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                        {b.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(b.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
