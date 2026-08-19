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

interface Analytics {
  weeklyRevenue: Array<{ day: string; revenue: number; count: number }>;
  topServices: Array<{ service_name: string; revenue: number; count: number }>;
  staffPerformance: Array<{ name: string; revenue: number; bills: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; count: number }>;
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

const REVENUE_PIN = "1122";

function RevenueChart({ data }: { data: Array<{ day: string; revenue: number }> }) {
  const days: Array<{ label: string; revenue: number; isToday: boolean }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const found = data.find((r) => r.day === dateStr);
    days.push({
      label: d.toLocaleDateString("en", { day: "numeric" }),
      revenue: found ? Number(found.revenue) : 0,
      isToday: i === 0,
    });
  }

  const max = Math.max(...days.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end justify-between gap-1.5 h-20 px-1">
      {days.map((d, i) => {
        const pct = d.revenue / max;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center" style={{ height: 60 }}>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${Math.max(pct * 100, d.revenue > 0 ? 8 : 3)}%`,
                  backgroundColor: d.isToday ? "#b8963e" : "#e8d5a3",
                  minHeight: 3,
                }}
                title={`Rs. ${Number(d.revenue).toLocaleString()}`}
              />
            </div>
            <span className="text-[9px] text-gray-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [revenueUnlocked, setRevenueUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<"services" | "staff">("services");

  function handlePinDigit(d: string) {
    if (pinInput.length >= 4) return;
    const next = pinInput + d;
    setPinInput(next);
    setPinError(false);
    if (next.length === 4) {
      if (next === REVENUE_PIN) {
        setRevenueUnlocked(true);
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

  useEffect(() => {
    async function load() {
      const [billingRes, bookingsRes, customersRes, stockRes, analyticsRes] = await Promise.all([
        fetch("/api/billing?period=today"),
        fetch("/api/bookings"),
        fetch("/api/customers"),
        fetch("/api/stock"),
        fetch("/api/analytics").catch(() => null),
      ]);
      const billing = await billingRes.json();
      const bookings = await bookingsRes.json();
      const customers = await customersRes.json();
      const stock = await stockRes.json();
      const analyticsData = analyticsRes ? await analyticsRes.json().catch(() => null) : null;

      const todayStr = new Date().toISOString().split("T")[0];
      const todayBookings = bookings.filter((b: { date: string }) => b.date === todayStr);

      setData({
        todayRevenue: billing.summary?.total_revenue || 0,
        todayBookings: todayBookings.length,
        totalCustomers: customers.length,
        lowStockCount: stock.lowStockCount || 0,
        recentBookings: bookings.slice(0, 5),
      });
      setAnalytics(analyticsData);
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

  const thisMonth = analytics?.monthlyRevenue?.[0];
  const lastMonth = analytics?.monthlyRevenue?.[1];
  const monthChange = thisMonth && lastMonth && Number(lastMonth.revenue) > 0
    ? Math.round(((Number(thisMonth.revenue) - Number(lastMonth.revenue)) / Number(lastMonth.revenue)) * 100)
    : null;

  return (
    <div className="max-w-2xl lg:max-w-4xl mx-auto space-y-4">

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
          {revenueUnlocked ? (
            <>
              <p className="text-3xl font-heading font-bold text-gold">Rs. {data.todayRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-0.5">today&apos;s revenue</p>
              <button onClick={() => setRevenueUnlocked(false)} className="text-[10px] text-gray-500 mt-1 underline">lock</button>
            </>
          ) : (
            <button onClick={() => setShowPinModal(true)} className="flex flex-col items-end gap-1 cursor-pointer">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-gold text-2xl font-heading font-bold tracking-widest">••••</span>
              </div>
              <p className="text-[10px] text-gray-400">tap to unlock</p>
            </button>
          )}
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

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-base font-semibold text-charcoal">Revenue — Last 14 Days</h2>
            {monthChange !== null && (
              <p className={`text-xs mt-0.5 ${monthChange >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {monthChange >= 0 ? "▲" : "▼"} {Math.abs(monthChange)}% vs last month
              </p>
            )}
          </div>
          {thisMonth && (
            <div className="text-right">
              <p className="text-sm font-bold text-charcoal">Rs. {Number(thisMonth.revenue).toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">this month</p>
            </div>
          )}
        </div>
        {analytics?.weeklyRevenue ? (
          <RevenueChart data={analytics.weeklyRevenue} />
        ) : (
          <div className="h-20 flex items-center justify-center text-gray-300 text-xs">Loading…</div>
        )}
      </div>

      {/* Top Services + Staff */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["services", "staff"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setAnalyticsTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                analyticsTab === tab ? "text-gold border-b-2 border-gold" : "text-gray-400"
              }`}
            >
              {tab === "services" ? "Top Services" : "Staff Performance"}
            </button>
          ))}
        </div>

        <div className="p-4">
          {analyticsTab === "services" ? (
            analytics?.topServices?.length ? (
              <div className="space-y-3">
                {analytics.topServices.map((s, i) => {
                  const max = Number(analytics.topServices[0].revenue) || 1;
                  const pct = (Number(s.revenue) / max) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-charcoal font-medium truncate max-w-[60%]">{s.service_name}</span>
                        <span className="text-xs text-gray-500">Rs. {Number(s.revenue).toLocaleString()} · {s.count}x</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gold/70 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] text-gray-400 pt-1">All time</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No billing data yet</p>
            )
          ) : (
            analytics?.staffPerformance?.length ? (
              <div className="space-y-2">
                {analytics.staffPerformance.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-gold">{s.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.bills} bills</p>
                    </div>
                    <p className="text-sm font-bold text-charcoal">Rs. {Number(s.revenue).toLocaleString()}</p>
                  </div>
                ))}
                <p className="text-[10px] text-gray-400 pt-1">Last 30 days</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No staff data yet</p>
            )
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/billing" className="bg-gold text-white rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:bg-gold-dark transition-colors active:scale-[0.98]">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </div>
          <div>
            <p className="font-semibold text-sm">New Bill</p>
            <p className="text-xs text-white/70">Add walk-in client</p>
          </div>
        </Link>
        <Link href="/admin/bookings" className="bg-[#1C1C1C] text-white rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:bg-[#2a2a2a] transition-colors active:scale-[0.98]">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
          </div>
          <div>
            <p className="font-semibold text-sm">Bookings</p>
            <p className="text-xs text-white/60">View all appointments</p>
          </div>
        </Link>
      </div>

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
              {[0,1,2,3].map((i) => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-150 ${pinError ? "bg-red-400 scale-110" : i < pinInput.length ? "bg-gold scale-110" : "bg-gray-200"}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => (
                <button
                  key={idx}
                  disabled={key === ""}
                  onClick={() => key === "⌫" ? setPinInput((p) => { setPinError(false); return p.slice(0,-1); }) : key ? handlePinDigit(key) : undefined}
                  className={`h-14 rounded-2xl text-lg font-semibold transition-all active:scale-95 ${key === "" ? "invisible" : key === "⌫" ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-gray-100 text-charcoal hover:bg-gold/10 active:bg-gold/20"}`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-heading text-base font-semibold text-charcoal">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-xs font-medium text-gold">View all →</Link>
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
                  <span className="text-sm font-semibold text-gold">{booking.customer_name.charAt(0).toUpperCase()}</span>
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
