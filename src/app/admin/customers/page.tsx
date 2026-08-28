"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/admin/Toast";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  surname: string | null;
  house_no: string | null;
  society: string | null;
  notes: string | null;
  created_at: string;
  total_spent?: number;
  visit_count?: number;
  last_visit?: string | null;
}

interface CustomerDetail {
  customer: Customer;
  bills: Array<{
    id: number;
    service_name: string;
    service_charge: number;
    discount: number;
    total: number;
    payment_method: string;
    created_at: string;
  }>;
  bookingHistory: Array<{
    group_id: number;
    date: string;
    time: string;
    status: string;
    service_names: string;
    total: number;
    discount: number;
  }>;
  stats: {
    totalSpent: number;
    totalVisits: number;
    totalDiscount: number;
    lastVisit: string | null;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", surname: "", house_no: "", society: "", notes: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const { toast } = useToast();

  const loadCustomers = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(data);
  };

  useEffect(() => {
    loadCustomers();
  }, [search, sort]);

  const addCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast("Customer added");
      setForm({ name: "", phone: "", email: "" });
      setShowAdd(false);
      loadCustomers();
    } else {
      toast("Failed to add customer", "error");
    }
  };

  const viewCustomer = async (id: number) => {
    setLoadingDetail(true);
    setEditingCustomer(false);
    const res = await fetch(`/api/customers/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedCustomer(data);
    } else {
      toast("Failed to load customer details", "error");
    }
    setLoadingDetail(false);
  };

  const saveEditCustomer = async () => {
    if (!selectedCustomer) return;
    setSavingEdit(true);
    const res = await fetch(`/api/customers/${selectedCustomer.customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      toast("Customer updated");
      setEditingCustomer(false);
      setSelectedCustomer((prev) =>
        prev ? { ...prev, customer: { ...prev.customer, ...editForm } } : null
      );
      loadCustomers();
    } else {
      toast("Failed to update", "error");
    }
    setSavingEdit(false);
  };

  return (
    <div className="space-y-6">
      {/* Customer detail modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedCustomer(null)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-3 sm:mx-4 max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {editingCustomer ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">First Name</label>
                          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 rounded border border-gray-200 text-sm focus:border-gold outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Surname</label>
                          <input value={editForm.surname} onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                            placeholder="Optional" className="w-full px-3 py-2 rounded border border-gray-200 text-sm focus:border-gold outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Phone</label>
                          <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="w-full px-3 py-2 rounded border border-gray-200 text-sm focus:border-gold outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Email</label>
                          <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            placeholder="Optional" className="w-full px-3 py-2 rounded border border-gray-200 text-sm focus:border-gold outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">House No.</label>
                          <input value={editForm.house_no} onChange={(e) => setEditForm({ ...editForm, house_no: e.target.value })}
                            placeholder="e.g. 12-B" className="w-full px-3 py-2 rounded border border-gray-200 text-sm focus:border-gold outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Society / Area</label>
                          <input value={editForm.society} onChange={(e) => setEditForm({ ...editForm, society: e.target.value })}
                            placeholder="e.g. Nasheman-e-Iqbal" className="w-full px-3 py-2 rounded border border-gray-200 text-sm focus:border-gold outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-400 uppercase mb-1">Notes</label>
                        <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          placeholder="Allergies, preferences, etc." rows={2}
                          className="w-full px-3 py-2 rounded border border-gray-200 text-sm focus:border-gold outline-none resize-none" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEditCustomer} disabled={savingEdit} className="btn-gold text-sm py-1.5 px-4 disabled:opacity-50">
                          {savingEdit ? "Saving…" : "Save"}
                        </button>
                        <button onClick={() => setEditingCustomer(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-heading text-lg sm:text-xl font-semibold text-charcoal truncate">
                        {selectedCustomer.customer.name}{selectedCustomer.customer.surname ? ` ${selectedCustomer.customer.surname}` : ""}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {selectedCustomer.customer.phone}
                        {selectedCustomer.customer.email && ` • ${selectedCustomer.customer.email}`}
                      </p>
                      {(selectedCustomer.customer.house_no || selectedCustomer.customer.society) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[selectedCustomer.customer.house_no, selectedCustomer.customer.society].filter(Boolean).join(", ")}
                        </p>
                      )}
                      {selectedCustomer.customer.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">{selectedCustomer.customer.notes}</p>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!editingCustomer && (
                    <button
                      onClick={() => {
                        const c = selectedCustomer.customer;
                        setEditForm({ name: c.name, phone: c.phone, email: c.email || "", surname: c.surname || "", house_no: c.house_no || "", society: c.society || "", notes: c.notes || "" });
                        setEditingCustomer(true);
                      }}
                      className="text-xs text-gold hover:text-gold-dark font-medium border border-gold/30 rounded px-2.5 py-1.5"
                    >
                      Edit
                    </button>
                  )}
                  <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                    &times;
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4">
                <div className="bg-green-50 rounded-md p-2 sm:p-3 text-center">
                  <p className="text-[10px] sm:text-xs text-gray-500">Total Spent</p>
                  <p className="text-sm sm:text-lg font-bold text-green-600">Rs. {selectedCustomer.stats.totalSpent.toFixed(0)}</p>
                </div>
                <div className="bg-blue-50 rounded-md p-2 sm:p-3 text-center">
                  <p className="text-[10px] sm:text-xs text-gray-500">Visits</p>
                  <p className="text-sm sm:text-lg font-bold text-blue-600">{selectedCustomer.stats.totalVisits}</p>
                </div>
                <div className="bg-red-50 rounded-md p-2 sm:p-3 text-center">
                  <p className="text-[10px] sm:text-xs text-gray-500">Discounts</p>
                  <p className="text-sm sm:text-lg font-bold text-red-500">Rs. {selectedCustomer.stats.totalDiscount.toFixed(0)}</p>
                </div>
              </div>
              {selectedCustomer.stats.lastVisit && (
                <p className="text-xs text-gray-400 mt-3">
                  Last visit: {new Date(selectedCustomer.stats.lastVisit).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Transaction history */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
              {/* Walk-in bills */}
              {selectedCustomer.bills.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Walk-in Bills
                  </h4>
                  <div className="space-y-3">
                    {selectedCustomer.bills.map((bill) => (
                      <div key={bill.id} className="flex items-start justify-between gap-3 py-3 border-b border-gray-50">
                        <div className="min-w-0 flex-1">
                          <div className="space-y-0.5">
                            {bill.service_name.split("|||").map((part, i) => (
                              <p key={i} className="text-sm font-medium text-charcoal">{part.split("~~")[0]?.trim() || part.trim()}</p>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(bill.created_at).toLocaleDateString()} • {bill.payment_method}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-green-600">Rs. {bill.total.toFixed(0)}</p>
                          {bill.discount > 0 && (
                            <p className="text-xs text-red-400">-Rs. {bill.discount.toFixed(0)} off</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointment bookings */}
              {selectedCustomer.bookingHistory.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Appointments
                  </h4>
                  <div className="space-y-3">
                    {selectedCustomer.bookingHistory.map((bk) => {
                      const finalTotal = bk.total - bk.discount;
                      const statusColors: Record<string, string> = {
                        confirmed: "text-blue-600 bg-blue-50",
                        completed: "text-green-700 bg-green-50",
                        cancelled: "text-red-600 bg-red-50",
                        pending: "text-yellow-700 bg-yellow-50",
                      };
                      return (
                        <div key={bk.group_id} className="flex items-start justify-between gap-3 py-3 border-b border-gray-50">
                          <div className="min-w-0 flex-1">
                            <div className="space-y-0.5">
                              {bk.service_names.split(" + ").map((s, i) => (
                                <p key={i} className="text-sm font-medium text-charcoal">{s.trim()}</p>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{bk.date} · {bk.time}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-charcoal">Rs. {finalTotal.toFixed(0)}</p>
                            {bk.discount > 0 && (
                              <p className="text-xs text-red-400">-Rs. {bk.discount.toFixed(0)} off</p>
                            )}
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${statusColors[bk.status] || "text-gray-600 bg-gray-100"}`}>
                              {bk.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedCustomer.bills.length === 0 && selectedCustomer.bookingHistory.length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">No history yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search & Add */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
            />
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="btn-gold text-sm py-2"
          >
            + Add Customer
          </button>
        </div>
        {/* Sort filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: "newest", label: "Newest" },
            { value: "highest_spend", label: "Highest Spend" },
            { value: "lowest_spend", label: "Lowest Spend" },
            { value: "most_visits", label: "Most Visits" },
            { value: "least_visits", label: "Least Visits" },
            { value: "recent_visit", label: "Recent Visit" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                sort === opt.value
                  ? "bg-gold text-white border-gold"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gold hover:text-gold"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={addCustomer} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">New Customer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Name *"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
            />
            <input
              type="tel"
              placeholder="Phone *"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-4 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-4 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-gold text-sm py-2">Save</button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="text-sm text-gray-500 px-1">{customers.length} customer(s)</div>

      {/* Customers — table (desktop) */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Total Spent</th>
                <th className="px-6 py-3">Visits</th>
                <th className="px-6 py-3">Last Visit</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-400">{c.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">{c.name}{c.surname ? ` ${c.surname}` : ""}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.phone}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {c.total_spent ? `Rs. ${Number(c.total_spent).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 font-medium">
                      {c.visit_count ?? 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {c.last_visit ? new Date(c.last_visit).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewCustomer(c.id)}
                        disabled={loadingDetail}
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

      {/* Customers — cards (mobile) */}
      <div className="md:hidden space-y-3">
        {customers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">
            No customers found
          </div>
        ) : (
          customers.map((c) => (
            <button
              key={c.id}
              onClick={() => viewCustomer(c.id)}
              disabled={loadingDetail}
              className="w-full text-left bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-charcoal truncate">{c.name}{c.surname ? ` ${c.surname}` : ""}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.phone}</p>
                  <div className="flex gap-3 mt-1.5">
                    {(c.total_spent ?? 0) > 0 && (
                      <span className="text-xs font-semibold text-green-600">Rs. {Number(c.total_spent).toLocaleString()}</span>
                    )}
                    {(c.visit_count ?? 0) > 0 && (
                      <span className="text-xs text-blue-500">{c.visit_count} visit{Number(c.visit_count) !== 1 ? "s" : ""}</span>
                    )}
                    {c.last_visit && (
                      <span className="text-xs text-gray-400">{new Date(c.last_visit).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <span className="flex-shrink-0 text-xs text-gold font-medium">View →</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
