"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardData {
  todayRevenue: number;
  todayBookings: number;
  todayTransactions: number;
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
        todayTransactions: billing.summary?.total_transactions || 0,
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
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    {
      label: "Today's Revenue",
      value: `Rs. ${data.todayRevenue.toFixed(0)}`,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
      color: "bg-green-50 text-green-700",
      link: "/admin/billing",
    },
    {
      label: "Today's Bookings",
      value: data.todayBookings,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
      color: "bg-blue-50 text-blue-700",
      link: "/admin/bookings",
    },
    {
      label: "Total Customers",
      value: data.totalCustomers,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
      color: "bg-purple-50 text-purple-700",
      link: "/admin/customers",
    },
    {
      label: "Low Stock Items",
      value: data.lowStockCount,
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
      color: data.lowStockCount > 0 ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700",
      link: "/admin/stock",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.link}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span>{stat.icon}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.color}`}>
                View
              </span>
            </div>
            <p className="text-2xl font-bold text-charcoal">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-charcoal">
            Recent Bookings
          </h2>
          <Link
            href="/admin/bookings"
            className="text-gold hover:text-gold-dark text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No bookings yet
                  </td>
                </tr>
              ) : (
                data.recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">
                      {booking.customer_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.service_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.time}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          booking.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/bookings"
          className="bg-gold/10 border border-gold/20 rounded-xl p-6 text-center hover:bg-gold/20 transition-colors"
        >
          <div className="flex justify-center mb-2 text-gold"><svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg></div>
          <p className="font-semibold text-charcoal">Manage Bookings</p>
        </Link>
        <Link
          href="/admin/billing"
          className="bg-green-50 border border-green-100 rounded-xl p-6 text-center hover:bg-green-100 transition-colors"
        >
          <div className="flex justify-center mb-2 text-green-600"><svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg></div>
          <p className="font-semibold text-charcoal">Add Bill</p>
        </Link>
        <Link
          href="/admin/stock"
          className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center hover:bg-blue-100 transition-colors"
        >
          <div className="flex justify-center mb-2 text-blue-600"><svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg></div>
          <p className="font-semibold text-charcoal">Check Stock</p>
        </Link>
      </div>
    </div>
  );
}
