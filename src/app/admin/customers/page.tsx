"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/admin/Toast";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  created_at: string;
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
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { toast } = useToast();

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
    const res = await fetch(`/api/customers/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedCustomer(data);
    } else {
      toast("Failed to load customer details", "error");
    }
    setLoadingDetail(false);
  };

  return (
    <div className="space-y-6">
      {/* Customer detail modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedCustomer(null)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading text-xl font-semibold text-charcoal">
                    {selectedCustomer.customer.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedCustomer.customer.phone}
                    {selectedCustomer.customer.email && ` • ${selectedCustomer.customer.email}`}
                  </p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600 text-xl">
                  &times;
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-5">
                <div className="bg-green-50 rounded-md p-3 text-center">
                  <p className="text-xs text-gray-500">Total Spent</p>
                  <p className="text-lg font-bold text-green-600">Rs. {selectedCustomer.stats.totalSpent.toFixed(0)}</p>
                </div>
                <div className="bg-blue-50 rounded-md p-3 text-center">
                  <p className="text-xs text-gray-500">Visits</p>
                  <p className="text-lg font-bold text-blue-600">{selectedCustomer.stats.totalVisits}</p>
                </div>
                <div className="bg-red-50 rounded-md p-3 text-center">
                  <p className="text-xs text-gray-500">Discounts</p>
                  <p className="text-lg font-bold text-red-500">Rs. {selectedCustomer.stats.totalDiscount.toFixed(0)}</p>
                </div>
              </div>
              {selectedCustomer.stats.lastVisit && (
                <p className="text-xs text-gray-400 mt-3">
                  Last visit: {new Date(selectedCustomer.stats.lastVisit).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Transaction history */}
            <div className="overflow-y-auto flex-1 p-6">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Transaction History
              </h4>
              {selectedCustomer.bills.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {selectedCustomer.bills.map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between py-3 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-medium text-charcoal">{bill.service_name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(bill.created_at).toLocaleDateString()} • {bill.payment_method}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">Rs. {bill.total.toFixed(0)}</p>
                        {bill.discount > 0 && (
                          <p className="text-xs text-red-400">-Rs. {bill.discount.toFixed(0)} off</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search & Add */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
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

      {/* Customers table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
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
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.email || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewCustomer(c.id)}
                        disabled={loadingDetail}
                        className="text-xs text-gold hover:text-gold-dark font-medium"
                      >
                        View History
                      </button>
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
