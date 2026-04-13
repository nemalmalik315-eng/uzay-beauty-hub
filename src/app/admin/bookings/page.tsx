"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/admin/Toast";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface Booking {
  id: number;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  service_price: number;
  category: string;
  date: string;
  time: string;
  status: string;
  notes: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({ date: "", time: "", notes: "" });
  const [confirmAction, setConfirmAction] = useState<{
    id: number;
    status: string;
    name: string;
  } | null>(null);
  const { toast } = useToast();

  const loadBookings = async () => {
    let url = "/api/bookings?";
    if (dateFilter) url += `date=${dateFilter}&`;
    if (filter !== "all") url += `status=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    setBookings(data);
  };

  useEffect(() => {
    loadBookings();
  }, [filter, dateFilter]);

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      toast(
        status === "confirmed"
          ? "Booking confirmed"
          : status === "completed"
          ? "Booking marked as completed"
          : "Booking cancelled",
        status === "cancelled" ? "info" : "success"
      );
      loadBookings();
    } else {
      toast("Failed to update booking", "error");
    }
  };

  const handleStatusClick = (id: number, status: string, customerName: string) => {
    if (status === "cancelled") {
      setConfirmAction({ id, status, name: customerName });
    } else {
      updateStatus(id, status);
    }
  };

  const saveEdit = async () => {
    if (!editingBooking) return;
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingBooking.id,
        date: editForm.date,
        time: editForm.time,
        notes: editForm.notes,
      }),
    });
    if (res.ok) {
      toast("Booking updated");
      setEditingBooking(null);
      loadBookings();
    } else {
      toast("Failed to update booking", "error");
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!confirmAction}
        title="Cancel Booking"
        message={`Are you sure you want to cancel ${confirmAction?.name}'s booking? This cannot be undone.`}
        confirmLabel="Cancel Booking"
        confirmColor="red"
        onConfirm={() => {
          if (confirmAction) updateStatus(confirmAction.id, confirmAction.status);
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Edit modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingBooking(null)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="font-heading text-lg font-semibold text-charcoal mb-4">
              Edit Booking — {editingBooking.customer_name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Time</label>
                <input
                  type="time"
                  value={editForm.time}
                  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Optional notes..."
                  className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:border-gold outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5">
              <button onClick={() => setEditingBooking(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button onClick={saveEdit} className="btn-gold py-2 px-5 text-sm">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-gray-200 text-sm focus:border-gold outline-none"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="text-sm text-gold hover:text-gold-dark mt-5"
            >
              Clear date
            </button>
          )}
          <div className="ml-auto mt-5 text-sm text-gray-500">
            {bookings.length} booking(s)
          </div>
        </div>
      </div>

      {/* Bookings table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-400">{b.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">
                      {b.customer_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.customer_phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="text-xs text-gray-400">{b.category}</span>
                      <br />
                      {b.service_name}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">
                      Rs. {b.service_price}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.time}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          b.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : b.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : b.status === "confirmed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <button
                            onClick={() => {
                              setEditingBooking(b);
                              setEditForm({ date: b.date, time: b.time, notes: b.notes || "" });
                            }}
                            className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
                          >
                            Edit
                          </button>
                        )}
                        {b.status === "pending" && (
                          <button
                            onClick={() => handleStatusClick(b.id, "confirmed", b.customer_name)}
                            className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
                          >
                            Confirm
                          </button>
                        )}
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <>
                            <button
                              onClick={() => handleStatusClick(b.id, "completed", b.customer_name)}
                              className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleStatusClick(b.id, "cancelled", b.customer_name)}
                              className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
                            >
                              Cancel
                            </button>
                          </>
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
    </div>
  );
}
