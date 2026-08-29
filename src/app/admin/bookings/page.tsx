"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/admin/Toast";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface BookingService {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface BookingGroup {
  group_id: number;
  customer_name: string;
  customer_phone: string;
  date: string;
  time: string;
  notes: string;
  status: string;
  discount: number;
  services: BookingService[];
  total: number;
  final_total: number;
}

async function buildReceiptBlob(group: BookingGroup, discount: number): Promise<{ blob: Blob; filename: string }> {
  const { default: jsPDF } = await import("jspdf");
  const finalTotal = group.total - discount;
  const now = new Date();
  const receiptId = `UBH-${group.group_id}-${now.getTime().toString().slice(-4)}`;
  const dateStr = now.toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });

  // Estimate page height dynamically
  const baseH = 105;
  const svcH = group.services.length * 6;
  const discH = discount > 0 ? 6 : 0;
  const pageH = Math.max(150, baseH + svcH + discH);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, pageH] });
  const W = 80;
  const M = 6; // margin
  const cx = W / 2;
  let y = M + 2;

  const dashed = () => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(M, y, W - M, y);
    doc.setLineDashPattern([], 0);
    y += 4;
  };

  // ── Brand header ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(201, 168, 76);
  doc.text("Uzay Beauty Hub", cx, y, { align: "center" });
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text("Beauty & Salon", cx, y, { align: "center" });
  y += 4;
  doc.text("112B, Block B, Nasheman-e-Iqbal Ph 2, Lahore", cx, y, { align: "center" });
  y += 4;
  doc.text("0334 4198243", cx, y, { align: "center" });
  y += 5;

  dashed();

  // ── Receipt ID ──
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(`Receipt #  ${receiptId}`, cx, y, { align: "center" });
  y += 4;
  doc.text(`${dateStr}   ${timeStr}`, cx, y, { align: "center" });
  y += 5;

  dashed();

  // ── Client info ──
  const infoRows: [string, string][] = [
    ["Client", group.customer_name],
    ["Phone", group.customer_phone],
    ["Appt.", `${group.date.split("-").reverse().join("/")}  ·  ${group.time}`],
  ];
  for (const [label, value] of infoRows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(label, M, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(value, M + 14, y);
    y += 5;
  }
  y += 1;
  dashed();

  // ── Services ──

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text("SERVICE", M, y);
  doc.text("PRICE", W - M, y, { align: "right" });
  y += 4;

  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  for (const s of group.services) {
    const name = s.name.length > 26 ? s.name.slice(0, 23) + "..." : s.name;
    doc.setFont("helvetica", "normal");
    doc.text(name, M, y);
    doc.text(`Rs. ${s.price.toLocaleString()}`, W - M, y, { align: "right" });
    y += 6;
  }
  y += 1;
  dashed();

  // ── Totals ──
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text("Subtotal", M, y);
  doc.text(`Rs. ${group.total.toLocaleString()}`, W - M, y, { align: "right" });
  y += 6;

  if (discount > 0) {
    doc.setTextColor(22, 163, 74);
    doc.text("Discount", M, y);
    doc.text(`- Rs. ${discount.toLocaleString()}`, W - M, y, { align: "right" });
    y += 6;
  }

  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([], 0);
  doc.line(M, y, W - M, y);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text("Total", M, y);
  doc.text(`Rs. ${finalTotal.toLocaleString()}`, W - M, y, { align: "right" });
  y += 7;

  dashed();

  // ── Footer ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 180);
  doc.text("Thank you for visiting Uzay Beauty Hub!", cx, y, { align: "center" });
  y += 4;
  doc.text("We look forward to seeing you again.", cx, y, { align: "center" });

  const filename = `receipt-${group.customer_name.replace(/\s+/g, "-")}-${group.group_id}.pdf`;
  return { blob: doc.output("blob"), filename };
}

// Used by the Receipt button on already-confirmed bookings (download only)
async function generateReceiptPdf(group: BookingGroup, discount: number) {
  const { blob, filename } = await buildReceiptBlob(group, discount);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function buildWaMessage(group: BookingGroup, discount: number): string {
  const finalTotal = group.total - discount;
  const serviceList = group.services.map((s) => `• ${s.name} — Rs. ${s.price.toLocaleString()}`).join("\n");
  const discountLine = discount > 0 ? `\nDiscount: − Rs. ${discount.toLocaleString()}` : "";
  return `Hi ${group.customer_name}! ✨ Your appointment at Uzay Beauty Hub is confirmed.\n\nServices:\n${serviceList}${discountLine}\nTotal: Rs. ${finalTotal.toLocaleString()}\n\nDate: ${fmtDate(group.date)}\nTime: ${group.time}\n\nWe look forward to seeing you! 💛\n\n— Uzay Beauty Hub\n📍 112B, Block B, Nasheman-e-Iqbal Phase 2, Lahore`;
}

function buildReminderMessage(group: BookingGroup): string {
  const serviceList = group.services.map((s) => `• ${s.name}`).join("\n");
  return `Hi ${group.customer_name}! 🌸 Just a reminder that your appointment at Uzay Beauty Hub is tomorrow.\n\nDate: ${fmtDate(group.date)}\nTime: ${group.time}\n\nServices:\n${serviceList}\n\nSee you tomorrow! 💛\n\n— Uzay Beauty Hub\n📍 112B, Block B, Nasheman-e-Iqbal Phase 2, Lahore`;
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  confirmed: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  no_show: "bg-gray-200 text-gray-600",
};

function to24h(t: string): string {
  if (!t) return "";
  if (/^\d{2}:\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return t;
  let h = parseInt(m[1]);
  if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
  if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

function to12h(t: string): string {
  if (!t) return "";
  if (/\d{1,2}:\d{2}\s*(AM|PM)/i.test(t)) return t;
  const m = t.match(/^(\d{2}):(\d{2})$/);
  if (!m) return t;
  let h = parseInt(m[1]);
  const min = m[2];
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${min} ${period}`;
}

const today = new Date().toISOString().split("T")[0];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingGroup[]>([]);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Confirm + discount modal
  const [confirmModal, setConfirmModal] = useState<BookingGroup | null>(null);
  const [discountInput, setDiscountInput] = useState("");

  // Cancel confirm dialog
  const [cancelConfirm, setCancelConfirm] = useState<{ group_id: number; name: string } | null>(null);

  // Edit modal (date/time only)
  const [editingGroup, setEditingGroup] = useState<BookingGroup | null>(null);
  const [editForm, setEditForm] = useState({ date: "", time: "" });

  // WhatsApp dialog
  const [waDialog, setWaDialog] = useState<{ phone: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { toast } = useToast();

  const loadBookings = async () => {
    let url = "/api/bookings?";
    if (dateFilter) url += `date=${dateFilter}&`;
    if (filter !== "all") url += `status=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    setBookings(Array.isArray(data) ? data : []);
  };

  useEffect(() => { loadBookings(); }, [filter, dateFilter]);

  // ── Confirm (with discount) ──────────────────────────────────────────────
  const handleConfirmClick = (group: BookingGroup) => {
    setDiscountInput("");
    setConfirmModal(group);
  };

  const handleConfirmWithDiscount = async () => {
    if (!confirmModal) return;
    const discount = parseInt(discountInput) || 0;
    const group = confirmModal;

    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: group.group_id, status: "confirmed", discount }),
    });

    if (res.ok) {
      toast("Booking confirmed", "success");
      const updatedGroup = { ...group, discount, final_total: group.total - discount };
      const phone = group.customer_phone.replace(/\D/g, "").replace(/^0/, "92");
      setWaDialog({ phone, message: buildWaMessage(group, discount) });
      setConfirmModal(null);
      loadBookings();
    } else {
      toast("Failed to confirm booking", "error");
    }
  };

  // ── Complete / Cancel ────────────────────────────────────────────────────
  const updateGroupStatus = async (group_id: number, status: string, group?: BookingGroup) => {
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id, status }),
    });
    if (!res.ok) { toast("Failed to update booking", "error"); return; }

    // Auto-create billing record when completing
    if (status === "completed" && group) {
      const serviceName = group.services.map((s) => `${s.name}~~${s.price}`).join("|||");
      const discount = group.discount ?? 0;
      await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: group_id,
          customer_name: group.customer_name,
          customer_phone: group.customer_phone || undefined,
          service_name: serviceName,
          service_charge: group.total,
          discount,
          total: group.total - discount,
          payment_method: "cash",
        }),
      });
      toast("Marked as completed & added to billing", "success");
    } else {
      const msg = status === "cancelled" ? "Booking cancelled" : status === "confirmed" ? "Booking reopened" : status === "no_show" ? "Marked as no-show" : "Updated";
      toast(msg, status === "cancelled" ? "info" : "success");
    }
    loadBookings();
  };

  // ── Edit (date/time) ─────────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!editingGroup) return;
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: editingGroup.group_id, date: editForm.date, time: to12h(editForm.time) }),
    });
    if (res.ok) {
      toast("Booking updated");
      setEditingGroup(null);
      loadBookings();
    } else {
      toast("Failed to update booking", "error");
    }
  };

  const discount = parseInt(discountInput) || 0;
  const finalTotal = confirmModal ? confirmModal.total - discount : 0;

  return (
    <div className="space-y-6">

      {/* ── Cancel confirm dialog ── */}
      <ConfirmDialog
        open={!!cancelConfirm}
        title="Cancel Booking"
        message={`Are you sure you want to cancel ${cancelConfirm?.name}'s booking? This cannot be undone.`}
        confirmLabel="Cancel Booking"
        confirmColor="red"
        onConfirm={() => {
          if (cancelConfirm) updateGroupStatus(cancelConfirm.group_id, "cancelled");
          setCancelConfirm(null);
        }}
        onCancel={() => setCancelConfirm(null)}
      />

      {/* ── Confirm + Discount modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmModal(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-5 max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-base font-semibold text-charcoal mb-1">Confirm Appointment</h3>
            <p className="text-xs text-gray-400 mb-4">{confirmModal.customer_name} · {fmtDate(confirmModal.date)} · {confirmModal.time}</p>

            {/* Services */}
            <div className="space-y-1 mb-3">
              {confirmModal.services.map((s) => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate pr-3">{s.name}</span>
                  <span className="text-gray-500 shrink-0">Rs. {s.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-medium text-charcoal pt-2 border-t border-gray-100 mb-4">
              <span>Subtotal</span>
              <span>Rs. {confirmModal.total.toLocaleString()}</span>
            </div>

            {/* Discount */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Discount (optional)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Rs.</span>
                <input
                  type="number"
                  min={0}
                  max={confirmModal.total}
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0"
                  className="flex-1 px-3 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
                />
              </div>
            </div>

            {/* Final total */}
            <div className="flex justify-between text-sm font-bold text-charcoal py-2.5 px-3 bg-gold/10 rounded-lg mb-4">
              <span>Final Total</span>
              <span className="text-gold">Rs. {finalTotal.toLocaleString()}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setConfirmModal(null)} className="flex-1 text-sm border border-gray-200 text-gray-500 py-2 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleConfirmWithDiscount} className="flex-1 text-sm bg-gold text-white py-2 rounded-lg hover:bg-gold/90 font-medium">
                Confirm &amp; Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WhatsApp dialog ── */}
      {waDialog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setWaDialog(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-5 max-w-sm w-full mx-4">
            <h3 className="font-heading text-base font-semibold text-charcoal mb-1">Notify Client via WhatsApp</h3>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              ⚠️ Send from the salon&apos;s WhatsApp: <strong>0334 4198243</strong>
            </p>
            <textarea
              readOnly
              value={waDialog.message}
              rows={9}
              className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(waDialog.message); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex-1 text-sm border border-gray-200 text-gray-600 py-2 rounded-lg hover:bg-gray-50"
              >
                {copied ? "Copied!" : "Copy Text"}
              </button>
              <a
                href={`https://wa.me/${waDialog.phone}?text=${encodeURIComponent(waDialog.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWaDialog(null)}
                className="flex-1 text-sm bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 font-medium text-center"
              >
                Send via WhatsApp
              </a>
            </div>
            <button onClick={() => setWaDialog(null)} className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 py-1">
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editingGroup && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingGroup(null)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">
              Edit Booking — {editingGroup.customer_name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Time</label>
                <input type="time" value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none" />
              </div>
              {editingGroup.notes && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Client&apos;s Request</label>
                  <p className="px-4 py-2.5 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-700">{editingGroup.notes}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setEditingGroup(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={saveEdit} className="btn-gold py-2 px-5 text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Date</label>
            <div className="flex items-center gap-2">
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none" />
              <button
                onClick={() => setDateFilter(dateFilter === today ? "" : today)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  dateFilter === today ? "bg-gold text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Today
              </button>
              {dateFilter && dateFilter !== today && (
                <button onClick={() => setDateFilter("")} className="text-sm text-gold hover:text-gold-dark">Clear</button>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No-show</option>
            </select>
          </div>
          <div className="ml-auto mt-5 text-sm text-gray-500">{bookings.length} booking(s)</div>
        </div>
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Services</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Date · Time</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No bookings found</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.group_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-charcoal">{b.customer_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{b.customer_phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {b.services.map((s) => (
                          <div key={s.id} className="text-sm text-gray-600">{s.name}</div>
                        ))}
                        {b.notes && <p className="text-xs text-amber-600 mt-1">📝 {b.notes}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">
                      {b.discount > 0 ? (
                        <>
                          <span className="line-through text-gray-400 text-xs mr-1">Rs. {b.total.toLocaleString()}</span>
                          <span>Rs. {b.final_total.toLocaleString()}</span>
                        </>
                      ) : (
                        <span>Rs. {b.total.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{fmtDate(b.date)}<br />{b.time}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[b.status] || "bg-gray-100 text-gray-600"}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <button onClick={() => { setEditingGroup(b); setEditForm({ date: b.date, time: to24h(b.time) }); }}
                            className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100">Edit</button>
                        )}
                        {b.status === "pending" && (
                          <button onClick={() => handleConfirmClick(b)}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">Confirm</button>
                        )}
                        {b.status === "confirmed" && (
                          <>
                            <button onClick={() => generateReceiptPdf(b, b.discount)}
                              className="text-xs bg-gold/10 text-gold px-2 py-1 rounded hover:bg-gold/20">Receipt</button>
                            <button onClick={() => {
                              const ph = b.customer_phone.replace(/\D/g, "").replace(/^0/, "92");
                              setWaDialog({ phone: ph, message: buildWaMessage(b, b.discount) });
                            }} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100">Message</button>
                            <button onClick={() => {
                              const ph = b.customer_phone.replace(/\D/g, "").replace(/^0/, "92");
                              setWaDialog({ phone: ph, message: buildReminderMessage(b) });
                            }} className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100">Remind</button>
                          </>
                        )}
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <>
                            <button onClick={() => updateGroupStatus(b.group_id, "completed", b)}
                              className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100">Complete</button>
                            <button onClick={() => updateGroupStatus(b.group_id, "no_show")}
                              className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded hover:bg-gray-200">No-show</button>
                            <button onClick={() => setCancelConfirm({ group_id: b.group_id, name: b.customer_name })}
                              className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">Cancel</button>
                          </>
                        )}
                        {(b.status === "completed" || b.status === "no_show") && (
                          <button onClick={() => updateGroupStatus(b.group_id, "confirmed")}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200">↩ Reopen</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-3">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">
            No bookings found
          </div>
        ) : (
          bookings.map((b) => (
            <div key={b.group_id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-charcoal truncate">{b.customer_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{b.customer_phone}</p>
                </div>
                <span className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[b.status] || "bg-gray-100 text-gray-600"}`}>
                  {b.status}
                </span>
              </div>

              {/* Services list */}
              <div className="text-xs space-y-1 mb-3 pb-3 border-b border-gray-100">
                {b.services.map((s, i) => (
                  <div key={s.id} className="flex justify-between">
                    <span className={i === 0 ? "text-gray-700 font-medium" : "text-gray-500"}>{s.name}</span>
                    <span className="text-gray-500">Rs. {s.price.toLocaleString()}</span>
                  </div>
                ))}
                {b.services.length > 1 && (
                  <div className="flex justify-between font-semibold text-charcoal pt-1 border-t border-gray-100">
                    <span>Total</span>
                    <span>
                      {b.discount > 0 ? (
                        <>
                          <span className="line-through text-gray-400 mr-1 font-normal">Rs. {b.total.toLocaleString()}</span>
                          Rs. {b.final_total.toLocaleString()}
                        </>
                      ) : `Rs. ${b.total.toLocaleString()}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span className="text-gray-400">Date · Time</span>
                  <span className="text-gray-700">{fmtDate(b.date)} · {b.time}</span>
                </div>
                {b.discount > 0 && b.services.length === 1 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">After discount</span>
                    <span className="text-charcoal font-semibold">Rs. {b.final_total.toLocaleString()}</span>
                  </div>
                )}
                {b.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Request</span>
                    <span className="text-amber-600 text-right ml-3 max-w-[65%]">{b.notes}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {(b.status === "pending" || b.status === "confirmed") && (
                  <button onClick={() => { setEditingGroup(b); setEditForm({ date: b.date, time: to24h(b.time) }); }}
                    className="text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-100">Edit</button>
                )}
                {b.status === "pending" && (
                  <button onClick={() => handleConfirmClick(b)}
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100">Confirm</button>
                )}
                {b.status === "confirmed" && (
                  <>
                    <button onClick={() => generateReceiptPdf(b, b.discount)}
                      className="text-xs bg-gold/10 text-gold px-3 py-1.5 rounded hover:bg-gold/20">Receipt</button>
                    <button onClick={() => {
                      const ph = b.customer_phone.replace(/\D/g, "").replace(/^0/, "92");
                      setWaDialog({ phone: ph, message: buildWaMessage(b, b.discount) });
                    }} className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100">Message</button>
                    <button onClick={() => {
                      const ph = b.customer_phone.replace(/\D/g, "").replace(/^0/, "92");
                      setWaDialog({ phone: ph, message: buildReminderMessage(b) });
                    }} className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded hover:bg-purple-100">Remind</button>
                  </>
                )}
                {(b.status === "pending" || b.status === "confirmed") && (
                  <>
                    <button onClick={() => updateGroupStatus(b.group_id, "completed", b)}
                      className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded hover:bg-purple-100">Complete</button>
                    <button onClick={() => updateGroupStatus(b.group_id, "no_show")}
                      className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded hover:bg-gray-200">No-show</button>
                    <button onClick={() => setCancelConfirm({ group_id: b.group_id, name: b.customer_name })}
                      className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100">Cancel</button>
                  </>
                )}
                {(b.status === "completed" || b.status === "no_show") && (
                  <button onClick={() => updateGroupStatus(b.group_id, "confirmed")}
                    className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-200">↩ Reopen</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
