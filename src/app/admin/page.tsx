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
      icon: "💰",
      color: "bg-green-50 text-green-700",
      link: "/admin/billing",
    },
    {
      label: "Today's Bookings",
      value: data.todayBookings,
      icon: "📅",
      color: "bg-blue-50 text-blue-700",
      link: "/admin/bookings",
    },
    {
      label: "Total Customers",
      value: data.totalCustomers,
      icon: "👥",
      color: "bg-purple-50 text-purple-700",
      link: "/admin/customers",
    },
    {
      label: "Low Stock Items",
      value: data.lowStockCount,
      icon: "⚠️",
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
              <span className="text-2xl">{stat.icon}</span>
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
          <span className="text-3xl block mb-2">📅</span>
          <p className="font-semibold text-charcoal">Manage Bookings</p>
        </Link>
        <Link
          href="/admin/billing"
          className="bg-green-50 border border-green-100 rounded-xl p-6 text-center hover:bg-green-100 transition-colors"
        >
          <span className="text-3xl block mb-2">💰</span>
          <p className="font-semibold text-charcoal">Add Bill</p>
        </Link>
        <Link
          href="/admin/stock"
          className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center hover:bg-blue-100 transition-colors"
        >
          <span className="text-3xl block mb-2">📦</span>
          <p className="font-semibold text-charcoal">Check Stock</p>
        </Link>
      </div>
    </div>
  );
}
