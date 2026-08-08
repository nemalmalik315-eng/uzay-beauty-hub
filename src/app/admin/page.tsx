"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardData {
  todayRevenue: number;
  todayBookings: number;
  totalCustomers: number;
  lowStockCount: number;
  recentBookings: Array<{
    id: number;
    customer_name: string;
    service_name: string;
    date: string;
    time: string;
    status: string;
  }>;
}

const statusStyle: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
  confirmed: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
};

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function load() {
      const [billingRes, bookingsRes, customersRes, stockRes] = await Promise.all([
        fetch("/api/billing?period=today"),
        fetch("/api/bookings"),
        fetch("/api/customers"),
        fetch("/api/stock"),
      ]);
      const billing = await billingRes.json();
      const bookings = await bookingsRes.json();
      const customers = await customersRes.json();
      const stock = await stockRes.json();

      const todayStr = new Date().toISOString().split("T")[0];
      const todayBookings = bookings.filter((b: { date: string }) => b.date === todayStr);

      setData({
        todayRevenue: billing.summary?.total_revenue || 0,
        todayBookings: todayBookings.length,
        totalCustomers: customers.length,
        lowStockCount: stock.lowStockCount || 0,
        recentBookings: bookings.slice(0, 5),
      });
    }
    load();
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "3px solid #C9A84C", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-5">

      {/* Greeting card */}
      <div className="bg-[#1C1C1C] rounded-2xl px-5 py-5 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-sm">{greet()},</p>
          <p className="text-white font-heading text-xl font-bold leading-tight">Uzay Beauty Hub ✨</p>
          <p className="text-gray-400 text-xs mt-1">
            {new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-3xl font-heading font-bold text-gold">Rs. {data.todayRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">today&apos;s revenue</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/admin/bookings" className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
          <div className="w-9 h-9 bg-gold/10 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
          </div>
          <p className="text-2xl font-bold text-charcoal">{data.todayBookings}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-tight">Today&apos;s Bookings</p>
        </Link>

        <Link href="/admin/customers" className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          </div>
          <p className="text-2xl font-bold text-charcoal">{data.totalCustomers}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-tight">Total Clients</p>
        </Link>

        <Link href="/admin/stock" className={`rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] ${data.lowStockCount > 0 ? "bg-red-50" : "bg-white"}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${data.lowStockCount > 0 ? "bg-red-100" : "bg-gray-100"}`}>
            <svg className={`w-5 h-5 ${data.lowStockCount > 0 ? "text-red-500" : "text-gray-400"}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          </div>
          <p className={`text-2xl font-bold ${data.lowStockCount > 0 ? "text-red-600" : "text-charcoal"}`}>{data.lowStockCount}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-tight">Low Stock</p>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/admin/billing"
          className="bg-gold text-white rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:bg-gold-dark transition-colors active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </div>
          <div>
            <p className="font-semibold text-sm">New Bill</p>
            <p className="text-xs text-white/70">Add walk-in client</p>
          </div>
        </Link>

        <Link
          href="/admin/bookings"
          className="bg-[#1C1C1C] text-white rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:bg-[#2a2a2a] transition-colors active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
          </div>
          <div>
            <p className="font-semibold text-sm">Bookings</p>
            <p className="text-xs text-white/60">View all appointments</p>
          </div>
        </Link>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading text-base font-semibold text-charcoal">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-xs font-medium text-gold">
            View all →
          </Link>
        </div>

        {data.recentBookings.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm text-gray-400">No bookings yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-gold">
                    {booking.customer_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal truncate">{booking.customer_name}</p>
                  <p className="text-xs text-gray-400 truncate">{booking.service_name}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle[booking.status] || "bg-gray-100 text-gray-500"}`}>
                    {booking.status}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5">{booking.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
