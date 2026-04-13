"use client";

import { useState, useEffect } from "react";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const loadCustomers = async () => {
    const url = search ? `/api/customers?search=${encodeURIComponent(search)}` : "/api/customers";
    const res = await fetch(url);
    const data = await res.json();
    setCustomers(data);
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const addCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", phone: "", email: "" });
    setShowAdd(false);
    loadCustomers();
  };

  return (
    <div className="space-y-6">
      {/* Search & Add */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            />
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="btn-gold text-sm py-2"
          >
            + Add Customer
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={addCustomer} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">New Customer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Name *"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            />
            <input
              type="tel"
              placeholder="Phone *"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-gold outline-none"
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

      {/* Customers table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 text-sm text-gray-500">
          {customers.length} customer(s)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-400">{c.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.email || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(c.created_at).toLocaleDateString()}
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
