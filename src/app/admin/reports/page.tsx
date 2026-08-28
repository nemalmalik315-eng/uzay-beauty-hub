"use client";

import { useState, useEffect } from "react";

interface ReportRow {
  period: string;
  transactions: number;
  charges: number;
  discounts: number;
  revenue: number;
}

interface TodaySummary {
  transactions: number;
  revenue: number;
  discounts: number;
}

interface PeakCell { day_of_week: string; hour_24: string; count: string }
interface CategoryRow { category: string; revenue: number }
interface Retention {
  total: number;
  returning: number;
  newThisMonth: number;
  avgDaysBetweenVisits: number;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19];
function fmt12(h: number) {
  if (h === 12) return "12 PM";
  if (h === 0) return "12 AM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

const CAT_COLORS: Record<string, string> = {
  "Hair": "#b8860b",
  "Hair Color": "#c0392b",
  "Hair Treatment": "#8b6914",
  "Facials": "#e74c8b",
  "Cleansing": "#f39c12",
  "Body Waxing": "#9b59b6",
  "Face Waxing": "#8e44ad",
  "Manicure & Pedicure": "#16a085",
  "Polisher": "#1abc9c",
  "Massage": "#2980b9",
  "Makeup": "#e74c3c",
  "Kids": "#27ae60",
  "Bridal": "#c0392b",
  "Assistant Bridal": "#e67e22",
  "Signature Bridal": "#d35400",
};

export default function ReportsPage() {
  const [type, setType] = useState("daily");
  const [data, setData] = useState<ReportRow[]>([]);
  const [today, setToday] = useState<TodaySummary | null>(null);

  const [peakHours, setPeakHours] = useState<PeakCell[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRow[]>([]);
  const [retention, setRetention] = useState<Retention | null>(null);

  useEffect(() => {
    fetch(`/api/reports?type=${type}`)
      .then((r) => r.json())
      .then((res) => { setData(res.data); setToday(res.today); });
  }, [type]);

  useEffect(() => {
    fetch("/api/reports?type=insights")
      .then((r) => r.json())
      .then((res) => {
        setPeakHours(res.peakHours ?? []);
        setCategoryRevenue(res.categoryRevenue ?? []);
        setRetention(res.retention ?? null);
      });
  }, []);

  // Build peak lookup: day × hour → count
  const peakMap = new Map<string, number>();
  let peakMax = 1;
  for (const cell of peakHours) {
    const key = `${cell.day_of_week}-${cell.hour_24}`;
    const n = Number(cell.count);
    peakMap.set(key, n);
    if (n > peakMax) peakMax = n;
  }

  const catMax = Math.max(...categoryRevenue.map((c) => c.revenue), 1);
  const retentionRate = retention && retention.total > 0
    ? Math.round((retention.returning / retention.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Today's highlight */}
      {today && (
        <div className="bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-lg p-4 sm:p-6">
          <h2 className="font-heading text-lg sm:text-xl font-semibold text-charcoal mb-3 sm:mb-4">
            Today&apos;s Summary
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Revenue</p>
              <p className="text-base sm:text-3xl font-bold text-green-600">Rs. {today.revenue.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Transactions</p>
              <p className="text-base sm:text-3xl font-bold text-charcoal">{today.transactions}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Discounts</p>
              <p className="text-base sm:text-3xl font-bold text-red-500">Rs. {today.discounts.toFixed(0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Peak Hours Heatmap */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="font-heading text-base sm:text-lg font-semibold text-charcoal">Peak Hours</h3>
          <p className="text-xs text-gray-400 mt-0.5">Last 90 days · confirmed & completed bookings</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Day headers */}
            <div className="grid mb-1" style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}>
              <div />
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] sm:text-xs font-medium text-gray-500 pb-1">{d}</div>
              ))}
            </div>
            {/* Hour rows */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid items-center mb-1" style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}>
                <div className="text-[10px] sm:text-xs text-gray-400 text-right pr-2 font-mono whitespace-nowrap">{fmt12(hour)}</div>
                {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                  const count = peakMap.get(`${dayIdx}-${hour}`) ?? 0;
                  const intensity = count / peakMax;
                  const bg = count === 0
                    ? "bg-gray-50"
                    : intensity < 0.25 ? "bg-gold/20"
                    : intensity < 0.5 ? "bg-gold/40"
                    : intensity < 0.75 ? "bg-gold/70"
                    : "bg-gold";
                  const text = intensity > 0.5 ? "text-white" : "text-charcoal";
                  return (
                    <div
                      key={dayIdx}
                      className={`mx-0.5 h-7 sm:h-8 rounded flex items-center justify-center text-[10px] font-semibold transition-colors ${bg} ${text}`}
                      title={`${DAYS[dayIdx]} ${fmt12(hour)}: ${count} booking${count !== 1 ? "s" : ""}`}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 ml-12">
              <span className="text-[10px] text-gray-400">Less</span>
              {["bg-gray-50", "bg-gold/20", "bg-gold/40", "bg-gold/70", "bg-gold"].map((c) => (
                <div key={c} className={`w-5 h-4 rounded ${c} border border-gray-100`} />
              ))}
              <span className="text-[10px] text-gray-400">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue by category + Retention side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue by Category */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="font-heading text-base sm:text-lg font-semibold text-charcoal">Revenue by Category</h3>
            <p className="text-xs text-gray-400 mt-0.5">Last 30 days</p>
          </div>
          {categoryRevenue.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No data yet</p>
          ) : (
            <div className="space-y-3">
              {categoryRevenue.map((cat) => {
                const color = CAT_COLORS[cat.category] ?? "#b8860b";
                const pct = Math.max((cat.revenue / catMax) * 100, 2);
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-charcoal truncate">{cat.category}</span>
                      <span className="text-gray-500 ml-2 flex-shrink-0">Rs. {Math.round(cat.revenue).toLocaleString()}</span>
                    </div>
                    <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Client Retention */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="font-heading text-base sm:text-lg font-semibold text-charcoal">Client Retention</h3>
            <p className="text-xs text-gray-400 mt-0.5">All time</p>
          </div>
          {retention ? (
            <div className="space-y-4">
              {/* Retention rate visual */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Returning clients</span>
                  <span className="font-bold text-charcoal">{retentionRate}%</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${retentionRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {retention.returning} of {retention.total} clients came back for a 2nd visit
                </p>
              </div>
              {/* Stat grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Clients</p>
                  <p className="text-xl font-bold text-blue-600 mt-1">{retention.total}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Returning</p>
                  <p className="text-xl font-bold text-green-600 mt-1">{retention.returning}</p>
                </div>
                <div className="bg-gold/10 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">New This Month</p>
                  <p className="text-xl font-bold text-gold mt-1">{retention.newThisMonth}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg. Gap</p>
                  <p className="text-xl font-bold text-purple-600 mt-1">
                    {retention.avgDaysBetweenVisits > 0 ? `${retention.avgDaysBetweenVisits}d` : "—"}
                  </p>
                  <p className="text-[10px] text-gray-400">between visits</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No data yet</p>
          )}
        </div>
      </div>

      {/* Period selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 sm:p-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "daily", short: "Daily", long: "Daily (30 days)" },
            { key: "weekly", short: "Weekly", long: "Weekly (90 days)" },
            { key: "monthly", short: "Monthly", long: "Monthly (1 year)" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setType(p.key)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                type === p.key ? "bg-gold text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="sm:hidden">{p.short}</span>
              <span className="hidden sm:inline">{p.long}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Detailed table — desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3">Transactions</th>
                <th className="px-6 py-3">Charges</th>
                <th className="px-6 py-3">Discounts</th>
                <th className="px-6 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No data for this period</td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.period} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-charcoal font-mono">{row.period}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.transactions}</td>
                    <td className="px-6 py-4 text-sm text-charcoal">Rs. {row.charges.toFixed(0)}</td>
                    <td className="px-6 py-4 text-sm text-red-500">-Rs. {row.discounts.toFixed(0)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">Rs. {row.revenue.toFixed(0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed list — mobile cards */}
      <div className="md:hidden space-y-2">
        {data.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-12 text-center text-gray-400 text-sm">
            No data for this period
          </div>
        ) : (
          data.map((row) => (
            <div key={row.period} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-charcoal font-mono">{row.period}</span>
                <span className="text-xs text-gray-400">{row.transactions} txn</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-gray-400 uppercase text-[10px]">Charges</p>
                  <p className="text-charcoal font-medium">Rs. {row.charges.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase text-[10px]">Discount</p>
                  <p className="text-red-500">-Rs. {row.discounts.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-gray-400 uppercase text-[10px]">Revenue</p>
                  <p className="font-bold text-green-600">Rs. {row.revenue.toFixed(0)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
