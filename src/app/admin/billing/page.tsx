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
  price_max?: number | null;
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
  priceMin: number;
  priceMax?: number | null;
  qty: number;
}

interface SavedBillInfo {
  billId: number;
  customerName: string;
  phone: string;
  services: SelectedService[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: string;
  billDate: string;
}

function buildWhatsAppUrl(info: SavedBillInfo): string {
  const digits = info.phone.replace(/\D/g, "");
  const waPhone = digits.startsWith("0") ? "92" + digits.slice(1)
    : digits.startsWith("92") ? digits : "92" + digits;
  const lines = [
    "✨ *Uzay Beauty Hub*",
    "━━━━━━━━━━━━━━━━",
    `Receipt #${info.billId}`,
    `Date: ${new Date(info.billDate + "T00:00:00").toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}`,
    `Customer: ${info.customerName}`,
    "",
    "*Services:*",
    ...info.services.flatMap((s) => Array(s.qty).fill(`• ${s.name} — Rs. ${s.price.toLocaleString()}`)),
    "",
    ...(info.discount > 0 ? [`Subtotal: Rs. ${info.subtotal.toLocaleString()}`, `Discount: −Rs. ${info.discount.toLocaleString()}`] : []),
    `*Total: Rs. ${info.grandTotal.toLocaleString()}* ✓`,
    `Payment: ${info.paymentMethod.charAt(0).toUpperCase() + info.paymentMethod.slice(1)}`,
    "━━━━━━━━━━━━━━━━",
    "Thank you for visiting Uzay Beauty Hub! 💄",
  ];
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}

// Parse service_name field — supports both new "Name~~Price|||Name~~Price" format
// and old "Name + Name" format (no individual prices in old records)
function parseServiceItems(raw: string): Array<{ name: string; price: number }> {
  if (raw.includes("|||") || raw.includes("~~")) {
    return raw.split("|||").map((part) => {
      const [n, p] = part.split("~~");
      return { name: n?.trim() || "", price: Number(p) || 0 };
    });
  }
  return raw.split(" + ").map((n) => ({ name: n.trim(), price: 0 }));
}

function fmtBillDate(dateStr: string): string {
  if (dateStr.length === 10) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  }
  return new Date(dateStr).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function encodeServiceName(services: SelectedService[]): string {
  return services.flatMap((s) => Array(s.qty).fill(`${s.name}~~${s.price}`)).join("|||");
}

const BILLING_PIN = "1122";

export default function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [period, setPeriod] = useState("today");
  const [summaryUnlocked, setSummaryUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  function handlePinDigit(d: string) {
    if (pinInput.length >= 4) return;
    const next = pinInput + d;
    setPinInput(next);
    setPinError(false);
    if (next.length === 4) {
      if (next === BILLING_PIN) {
        setSummaryUnlocked(true);
        setShowPinModal(false);
        setPinInput("");
      } else {
        setPinError(true);
        setTimeout(() => { setPinInput(""); setPinError(false); }, 700);
      }
    }
  }

  function closePinModal() {
    setShowPinModal(false);
    setPinInput("");
    setPinError(false);
  }
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
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [savedBillInfo, setSavedBillInfo] = useState<SavedBillInfo | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);
  const [editingBillId, setEditingBillId] = useState<number | null>(null);
  const phoneTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const serviceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const subtotal = selectedServices.reduce((sum, s) => sum + s.price * s.qty, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  // Filter bills by service name
  const filteredBills = serviceFilter
    ? bills.filter((b) =>
        parseServiceItems(b.service_name).some((s) =>
          s.name.toLowerCase().includes(serviceFilter.toLowerCase())
        )
      )
    : bills;

  // Get unique service keywords from current bills for quick filters
  const serviceKeywords = [...new Set(
    bills.flatMap((b) => parseServiceItems(b.service_name).map((s) => s.name))
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
    const existing = selectedServices.findIndex((s) => s.id === service.id);
    if (existing >= 0) {
      const updated = [...selectedServices];
      updated[existing] = { ...updated[existing], qty: updated[existing].qty + 1 };
      setSelectedServices(updated);
    } else {
      setSelectedServices([...selectedServices, {
        id: service.id,
        name: service.name,
        price: service.price,
        priceMin: service.price,
        priceMax: service.price_max ?? null,
        qty: 1,
      }]);
    }
    setServiceSearch("");
    setShowServiceDropdown(false);
  };

  const updateServicePrice = (index: number, newPrice: number) => {
    const updated = [...selectedServices];
    updated[index] = { ...updated[index], price: newPrice };
    setSelectedServices(updated);
  };

  const changeQty = (index: number, delta: number) => {
    const updated = [...selectedServices];
    const newQty = updated[index].qty + delta;
    if (newQty <= 0) {
      setSelectedServices(updated.filter((_, i) => i !== index));
    } else {
      updated[index] = { ...updated[index], qty: newQty };
      setSelectedServices(updated);
    }
  };

  const removeService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const CATEGORY_ORDER = [
    "Hair", "Hair Color", "Hair Treatment", "Facials", "Cleansing", "Polisher",
    "Body Waxing", "Face Waxing", "Manicure & Pedicure", "Makeup", "Kids",
    "Assistant Bridal", "Signature Bridal", "Bridal", "Azaadi Deals",
  ];

  // Group services by category for the dropdown
  const groupedServices: Record<string, Service[]> = {};
  filteredServices.forEach((s) => {
    if (!groupedServices[s.category]) groupedServices[s.category] = [];
    groupedServices[s.category].push(s);
  });
  const sortedGroupKeys = Object.keys(groupedServices).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const startEdit = (bill: Bill) => {
    const items = parseServiceItems(bill.service_name);
    const rebuilt: SelectedService[] = [];
    for (const item of items) {
      const svc = services.find((s) => s.name === item.name);
      if (svc) {
        const existing = rebuilt.findIndex((r) => r.id === svc.id && r.price === item.price);
        if (existing >= 0) {
          rebuilt[existing].qty += 1;
        } else {
          rebuilt.push({ id: svc.id, name: svc.name, price: item.price, priceMin: svc.price, priceMax: svc.price_max ?? null, qty: 1 });
        }
      } else {
        rebuilt.push({ id: -(Date.now() + rebuilt.length), name: item.name, price: item.price, priceMin: item.price, priceMax: null, qty: 1 });
      }
    }
    setSelectedServices(rebuilt);
    setCustomerName(bill.customer_name);
    setPhone("");
    setDiscount(bill.discount);
    setPaymentMethod(bill.payment_method);
    setBillDate(bill.created_at.slice(0, 10));
    setEditingBillId(bill.id);
    setSavedBillInfo(null);
    setShowAdd(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setPhone("");
    setCustomerName("");
    setSelectedServices([]);
    setDiscount(0);
    setPaymentMethod("cash");
    setServiceSearch("");
    setBillDate(new Date().toISOString().split("T")[0]);
    setSavedBillInfo(null);
    setEditingBillId(null);
    setShowAdd(false);
  };

  const saveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0 || !customerName.trim()) return;

    setSaving(true);
    try {
      const encodedName = encodeServiceName(selectedServices);
      let savedId: number;

      if (editingBillId) {
        const res = await fetch("/api/billing", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingBillId,
            service_name: encodedName,
            service_charge: subtotal,
            discount,
            payment_method: paymentMethod,
          }),
        });
        if (!res.ok) { toast("Failed to update bill", "error"); return; }
        savedId = editingBillId;
      } else {
        const res = await fetch("/api/billing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: customerName.trim(),
            customer_phone: phone.trim() || undefined,
            service_name: encodedName,
            service_charge: subtotal,
            discount,
            payment_method: paymentMethod,
            bill_date: billDate,
          }),
        });
        if (!res.ok) { toast("Failed to save bill", "error"); return; }
        const saved = await res.json();
        savedId = saved.id;
      }

      setSavedBillInfo({
        billId: savedId,
        customerName: customerName.trim(),
        phone: phone.trim(),
        services: [...selectedServices],
        subtotal,
        discount,
        grandTotal,
        paymentMethod,
        billDate,
      });
      setPhone("");
      setCustomerName("");
      setSelectedServices([]);
      setDiscount(0);
      setPaymentMethod("cash");
      setServiceSearch("");
      setBillDate(new Date().toISOString().split("T")[0]);
      setEditingBillId(null);
      loadBills();
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
    const services = parseServiceItems(bill.service_name);
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
      ${services.map(s => `<div class="row"><span>${s.name}</span><span>${s.price ? "Rs. " + s.price.toFixed(0) : "—"}</span></div>`).join("")}
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
        summaryUnlocked ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-white rounded-lg border border-gray-100 p-3 sm:p-5">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Total Charges</p>
              <p className="text-base sm:text-2xl font-bold text-charcoal mt-1">Rs. {summary.total_charges.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-3 sm:p-5">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Discounts</p>
              <p className="text-base sm:text-2xl font-bold text-red-500 mt-1">-Rs. {summary.total_discounts.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-3 sm:p-5">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Net Revenue</p>
              <p className="text-base sm:text-2xl font-bold text-green-600 mt-1">Rs. {summary.total_revenue.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-3 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Transactions</p>
                <p className="text-base sm:text-2xl font-bold text-charcoal mt-1">{summary.total_transactions}</p>
              </div>
              <button
                onClick={() => setSummaryUnlocked(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Lock"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowPinModal(true)}
            className="w-full bg-white rounded-lg border border-gray-100 p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-charcoal">Revenue Summary</p>
              <p className="text-xs text-gray-400">Tap to unlock · {summary.total_transactions} transactions</p>
            </div>
            <span className="ml-auto text-gold text-lg font-heading font-bold tracking-widest">••••</span>
          </button>
        )
      )}

      {/* PIN modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={closePinModal}>
          <div className="bg-white w-full max-w-sm rounded-t-3xl p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h3 className="font-heading text-lg font-bold text-charcoal">Enter PIN</h3>
              <p className="text-sm text-gray-400 mt-1">Owner access only</p>
            </div>
            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-150 ${pinError ? "bg-red-400 scale-110" : i < pinInput.length ? "bg-gold scale-110" : "bg-gray-200"}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => (
                <button
                  key={idx}
                  disabled={key === ""}
                  onClick={() => key === "⌫" ? setPinInput((p) => { setPinError(false); return p.slice(0, -1); }) : key ? handlePinDigit(key) : undefined}
                  className={`h-14 rounded-2xl text-lg font-semibold transition-all active:scale-95 ${key === "" ? "invisible" : key === "⌫" ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-gray-100 text-charcoal hover:bg-gold/10 active:bg-gold/20"}`}
                >
                  {key}
                </button>
              ))}
            </div>
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
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => {
                const rows = [
                  ["Date", "Customer", "Service", "Charge", "Discount", "Total", "Payment"],
                  ...bills.map((b) => [
                    new Date(b.created_at).toLocaleDateString("en-PK"),
                    b.customer_name,
                    b.service_name.replace(/\|\|\|/g, " + ").replace(/~~\d+/g, ""),
                    b.service_charge,
                    b.discount,
                    b.total,
                    b.payment_method,
                  ]),
                ];
                const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `billing-${period}-${new Date().toISOString().split("T")[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="btn-gold text-sm py-2"
            >
              {showAdd ? "Cancel" : "+ Walk-in Bill"}
            </button>
          </div>
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

      {/* Walk-in bill — saved success + WhatsApp */}
      {showAdd && savedBillInfo && (
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-charcoal">Bill #{savedBillInfo.billId} Saved</p>
              <p className="text-xs text-gray-400">{savedBillInfo.customerName} · {new Date(savedBillInfo.billDate + "T00:00:00").toLocaleDateString()}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-md p-3 mb-4 text-sm space-y-1">
            {savedBillInfo.services.map((s, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-charcoal">{s.name}{s.qty > 1 ? ` ×${s.qty}` : ""}</span>
                <span className="text-gray-500">Rs. {(s.price * s.qty).toLocaleString()}</span>
              </div>
            ))}
            {savedBillInfo.discount > 0 && (
              <div className="flex justify-between text-red-500 border-t border-gray-200 pt-1 mt-1">
                <span>Discount</span><span>−Rs. {savedBillInfo.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-gray-200 pt-1 mt-1">
              <span>Total</span><span>Rs. {savedBillInfo.grandTotal.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {savedBillInfo.phone && (
              <a
                href={buildWhatsAppUrl(savedBillInfo)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#25D366] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[#1EBE5A] transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Send on WhatsApp
              </a>
            )}
            <button
              type="button"
              onClick={() => setSavedBillInfo(null)}
              className="btn-gold text-sm py-2 px-4"
            >
              + New Bill
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Walk-in bill form */}
      {showAdd && !savedBillInfo && (
        <form onSubmit={saveBill} className="bg-white rounded-lg border border-gray-100 p-6">
          <h3 className="font-heading text-lg font-semibold mb-5">
            {editingBillId ? `Edit Bill #${editingBillId}` : "New Walk-in Bill"}
          </h3>

          {/* Customer info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Phone Number <span className="normal-case text-gray-400 font-normal">(optional)</span>
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
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Bill Date
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
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
                onClick={() => setShowServiceDropdown(true)}
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
              />
              {showServiceDropdown && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {sortedGroupKeys.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">No services found</p>
                  ) : (
                    sortedGroupKeys.map((category) => {
                      const items = groupedServices[category];
                      return (
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
                              <span className="text-gold font-medium">
                                {s.price_max ? `Rs. ${s.price.toLocaleString()}–${s.price_max.toLocaleString()}` : `Rs. ${s.price.toLocaleString()}`}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })
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
                    className="bg-gray-50 px-4 py-2.5 rounded-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm flex-1 min-w-0 truncate">{s.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => changeQty(i, -1)}
                          className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold flex items-center justify-center leading-none"
                        >−</button>
                        <span className="text-sm font-semibold w-5 text-center">{s.qty}</span>
                        <button
                          type="button"
                          onClick={() => changeQty(i, +1)}
                          className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold flex items-center justify-center leading-none"
                        >+</button>
                        <span className="text-sm font-medium text-gray-600 w-20 text-right">
                          Rs. {(s.price * s.qty).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeService(i)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none ml-1"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                    {s.priceMax && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">Price (Rs. {s.priceMin.toLocaleString()}–{s.priceMax.toLocaleString()}):</span>
                        <input
                          type="number"
                          min={s.priceMin}
                          max={s.priceMax}
                          value={s.price || ""}
                          placeholder={s.priceMin.toString()}
                          onChange={(e) => updateServicePrice(i, parseInt(e.target.value) || 0)}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            if (val < s.priceMin) updateServicePrice(i, s.priceMin);
                            else if (s.priceMax && val > s.priceMax) updateServicePrice(i, s.priceMax);
                          }}
                          className="w-24 px-2 py-1 text-sm border border-gold/40 rounded-md focus:border-gold outline-none font-medium text-charcoal"
                        />
                      </div>
                    )}
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
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Discount</span>
                    <span>-Rs. {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-charcoal border-t border-gray-200 mt-1.5 pt-1.5">
                  <span>Total</span>
                  <span>Rs. {grandTotal.toLocaleString()}</span>
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
              {saving ? "Saving..." : editingBillId ? "Update Bill" : "Save Bill"}
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

      {/* Bills — table (desktop) */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-100 overflow-hidden">
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
                      <div className="space-y-0.5">
                        {parseServiceItems(b.service_name).map((s, i) => (
                          <div key={i} className="flex justify-between gap-4">
                            <span>{s.name}</span>
                            {s.price > 0 && <span className="text-gray-400 shrink-0">Rs. {s.price.toLocaleString()}</span>}
                          </div>
                        ))}
                      </div>
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
                      {fmtBillDate(b.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(b)}
                          className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
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

      {/* Bills — cards (mobile) */}
      <div className="md:hidden space-y-3">
        {filteredBills.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">
            {serviceFilter ? `No bills matching "${serviceFilter}"` : "No bills for this period"}
          </div>
        ) : (
          filteredBills.map((b) => (
            <div key={b.id} className="bg-white rounded-lg border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-charcoal truncate">{b.customer_name}</p>
                  <p className="text-[10px] text-gray-400">#{b.id} · {fmtBillDate(b.created_at)}</p>
                </div>
                <span className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                  {b.payment_method}
                </span>
              </div>
              <div className="mb-3 space-y-0.5">
                {parseServiceItems(b.service_name).map((s, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-600">{s.name}</span>
                    {s.price > 0 && <span className="text-gray-400">Rs. {s.price.toLocaleString()}</span>}
                  </div>
                ))}
              </div>
              <div className="flex items-end justify-between gap-3 pb-3 border-b border-gray-100 mb-3">
                <div className="text-xs text-gray-500">
                  <div>Charge: Rs. {b.service_charge.toFixed(0)}</div>
                  {b.discount > 0 && <div className="text-red-500">Discount: -Rs. {b.discount.toFixed(0)}</div>}
                </div>
                <p className="text-base font-bold text-green-600">Rs. {b.total.toFixed(0)}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => startEdit(b)}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => printReceipt(b)}
                  className="text-xs text-gold hover:text-gold-dark font-medium"
                >
                  Print Receipt
                </button>
                <button
                  onClick={() => setDeletingBill(b)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
