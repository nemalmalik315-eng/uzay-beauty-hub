"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/admin/Toast";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

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

interface Customer {
  id: number;
  name: string;
  phone: string;
}

interface SelectedService {
  id: number;
  name: string;
  price: number;
}

export default function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [period, setPeriod] = useState("today");
  const [showAdd, setShowAdd] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceFilter, setServiceFilter] = useState("");

  // Walk-in form state
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [serviceSearch, setServiceSearch] = useState("");
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);
  const phoneTimeout = useRef<ReturnType<typeof setTimeout>>();
  const serviceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const subtotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  // Filter bills by service name
  const filteredBills = serviceFilter
    ? bills.filter((b) =>
        b.service_name.toLowerCase().includes(serviceFilter.toLowerCase())
      )
    : bills;

  // Get unique service keywords from current bills for quick filters
  const serviceKeywords = [...new Set(
    bills.flatMap((b) =>
      b.service_name.split(" + ").map((s) => s.trim())
    )
  )].sort();

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

  // Customer lookup by phone
  useEffect(() => {
    if (phone.length < 3) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    clearTimeout(phoneTimeout.current);
    phoneTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(phone)}`);
      const data = await res.json();
      setCustomerSuggestions(data);
      setShowSuggestions(data.length > 0);
    }, 300);
  }, [phone]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (serviceRef.current && !serviceRef.current.contains(e.target as Node)) {
        setShowServiceDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectCustomer = (c: Customer) => {
    setPhone(c.phone);
    setCustomerName(c.name);
    setShowSuggestions(false);
  };

  const addService = (service: Service) => {
    setSelectedServices([...selectedServices, { id: service.id, name: service.name, price: service.price }]);
    setServiceSearch("");
    setShowServiceDropdown(false);
  };

  const removeService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // Group services by category for the dropdown
  const groupedServices: Record<string, Service[]> = {};
  filteredServices.forEach((s) => {
    if (!groupedServices[s.category]) groupedServices[s.category] = [];
    groupedServices[s.category].push(s);
  });

  const resetForm = () => {
    setPhone("");
    setCustomerName("");
    setSelectedServices([]);
    setDiscount(0);
    setPaymentMethod("cash");
    setServiceSearch("");
    setShowAdd(false);
  };

  const saveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0 || !customerName.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phone: phone.trim() || undefined,
          service_name: selectedServices.map((s) => s.name).join(" + "),
          service_charge: subtotal,
          discount,
          payment_method: paymentMethod,
        }),
      });
      if (res.ok) {
        toast(`Bill saved — Rs. ${grandTotal} from ${customerName.trim()}`);
        resetForm();
        loadBills();
      } else {
        toast("Failed to save bill", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteBill = async (bill: Bill) => {
    const res = await fetch(`/api/billing?id=${bill.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Bill deleted");
      setDeletingBill(null);
      loadBills();
    } else {
      toast("Failed to delete bill", "error");
    }
  };

  const printReceipt = (bill: Bill) => {
    const services = bill.service_name.split(" + ");
    const perService = bill.service_charge / services.length;
    const receiptWindow = window.open("", "_blank", "width=380,height=600");
    if (!receiptWindow) return;
    receiptWindow.document.write(`
      <html><head><title>Receipt #${bill.id}</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; font-size: 13px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #333; margin: 10px 0; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; }
        h2 { margin: 0; font-size: 18px; }
        p { margin: 4px 0; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="center">
        <h2>Uzay Beauty Hub</h2>
        <p style="font-size:11px;">112B, Block B, Nasheman-e-Iqbal Phase 2, Lahore</p>
        <p style="font-size:11px;">WhatsApp: 0334 4198243</p>
      </div>
      <div class="line"></div>
      <div class="row"><span>Receipt #</span><span class="bold">${bill.id}</span></div>
      <div class="row"><span>Date</span><span>${new Date(bill.created_at).toLocaleString()}</span></div>
      <div class="row"><span>Customer</span><span class="bold">${bill.customer_name}</span></div>
      <div class="row"><span>Payment</span><span>${bill.payment_method.toUpperCase()}</span></div>
      <div class="line"></div>
      <p class="bold">Services:</p>
      ${services.map(s => `<div class="row"><span>${s}</span><span>Rs. ${perService.toFixed(0)}</span></div>`).join("")}
      <div class="line"></div>
      <div class="row"><span>Subtotal</span><span>Rs. ${bill.service_charge.toFixed(0)}</span></div>
      ${bill.discount > 0 ? `<div class="row"><span>Discount</span><span>-Rs. ${bill.discount.toFixed(0)}</span></div>` : ""}
      <div class="row bold" style="font-size:16px;margin-top:6px;"><span>TOTAL</span><span>Rs. ${bill.total.toFixed(0)}</span></div>
      <div class="line"></div>
      <p class="center" style="font-size:11px;margin-top:15px;">Thank you for visiting Uzay Beauty Hub!</p>
      <p class="center" style="font-size:10px;">Follow us @uzay_beautyhub</p>
      <script>window.onload = function() { window.print(); }</script>
      </body></html>
    `);
    receiptWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!deletingBill}
        title="Delete Bill"
        message={`Delete bill #${deletingBill?.id} for ${deletingBill?.customer_name}? This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={() => deletingBill && deleteBill(deletingBill)}
        onCancel={() => setDeletingBill(null)}
      />

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Charges</p>
            <p className="text-2xl font-bold text-charcoal mt-1">Rs. {summary.total_charges.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Discounts</p>
            <p className="text-2xl font-bold text-red-500 mt-1">-Rs. {summary.total_discounts.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Net Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-1">Rs. {summary.total_revenue.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Transactions</p>
            <p className="text-2xl font-bold text-charcoal mt-1">{summary.total_transactions}</p>
          </div>
        </div>
      )}

      {/* Period filter & Add */}
      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {["today", "week", "month"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
            {showAdd ? "Cancel" : "+ Walk-in Bill"}
          </button>
        </div>
      </div>

      {/* Service filter */}
      {bills.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Filter by service..."
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none w-48"
            />
            {serviceFilter && (
              <button
                onClick={() => setServiceFilter("")}
                className="text-xs text-gold hover:text-gold-dark"
              >
                Clear
              </button>
            )}
            <span className="text-xs text-gray-400 mx-1">Quick:</span>
            {serviceKeywords.slice(0, 8).map((kw) => (
              <button
                key={kw}
                onClick={() => setServiceFilter(serviceFilter === kw ? "" : kw)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  serviceFilter === kw
                    ? "bg-gold text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {kw}
              </button>
            ))}
            {serviceFilter && (
              <span className="ml-auto text-xs text-gray-500">
                {filteredBills.length} of {bills.length} bills
              </span>
            )}
          </div>
        </div>
      )}

      {/* Walk-in bill form */}
      {showAdd && (
        <form onSubmit={saveBill} className="bg-white rounded-lg border border-gray-100 p-6">
          <h3 className="font-heading text-lg font-semibold mb-5">New Walk-in Bill</h3>

          {/* Customer info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="03XX XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={() => customerSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
              />
              {showSuggestions && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {customerSuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => selectCustomer(c)}
                      className="w-full px-4 py-2.5 text-left hover:bg-gold/5 text-sm flex justify-between"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-gray-400">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Customer Name *
              </label>
              <input
                type="text"
                placeholder="Full name"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
              />
            </div>
          </div>

          {/* Service picker */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Services *
            </label>
            <div ref={serviceRef} className="relative">
              <input
                type="text"
                placeholder="Search services... (e.g. Facial, Haircut, Manicure)"
                value={serviceSearch}
                onChange={(e) => {
                  setServiceSearch(e.target.value);
                  setShowServiceDropdown(true);
                }}
                onFocus={() => setShowServiceDropdown(true)}
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
              />
              {showServiceDropdown && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {Object.keys(groupedServices).length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">No services found</p>
                  ) : (
                    Object.entries(groupedServices).map(([category, items]) => (
                      <div key={category}>
                        <p className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-50 sticky top-0">
                          {category}
                        </p>
                        {items.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => addService(s)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gold/5 text-sm flex justify-between items-center"
                          >
                            <span>{s.name}</span>
                            <span className="text-gold font-medium">Rs. {s.price}</span>
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Selected services list */}
            {selectedServices.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedServices.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-50 px-4 py-2.5 rounded-md"
                  >
                    <span className="text-sm">{s.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Rs. {s.price}</span>
                      <button
                        type="button"
                        onClick={() => removeService(i)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discount & Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Discount (Rs.)
              </label>
              <input
                type="number"
                placeholder="0"
                min={0}
                value={discount || ""}
                onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="online">Online Transfer</option>
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">Easypaisa</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-gray-50 rounded-md px-4 py-2.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Discount</span>
                    <span>-Rs. {discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-charcoal border-t border-gray-200 mt-1.5 pt-1.5">
                  <span>Total</span>
                  <span>Rs. {grandTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving || selectedServices.length === 0}
              className="btn-gold py-2.5 px-6 text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Bill"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-700 px-4"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Bills table */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Services</th>
                <th className="px-6 py-3">Charge</th>
                <th className="px-6 py-3">Discount</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    {serviceFilter ? `No bills matching "${serviceFilter}"` : "No bills for this period"}
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-400">{b.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">{b.customer_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      {b.service_name}
                    </td>
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
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => printReceipt(b)}
                          className="text-xs text-gold hover:text-gold-dark font-medium"
                        >
                          Print
                        </button>
                        <button
                          onClick={() => setDeletingBill(b)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Delete
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
    </div>
  );
}
