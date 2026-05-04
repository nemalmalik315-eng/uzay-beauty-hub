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

export default function ReportsPage() {
  const [type, setType] = useState("daily");
  const [data, setData] = useState<ReportRow[]>([]);
  const [today, setToday] = useState<TodaySummary | null>(null);

  useEffect(() => {
    fetch(`/api/reports?type=${type}`)
      .then((r) => r.json())
      .then((res) => {
        setData(res.data);
        setToday(res.today);
      });
  }, [type]);

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

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
                type === p.key
                  ? "bg-gold text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className="sm:hidden">{p.short}</span>
              <span className="hidden sm:inline">{p.long}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Visual bar chart */}
      {data.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="font-heading text-base sm:text-lg font-semibold text-charcoal mb-4 sm:mb-6">Revenue Overview</h3>
          <div className="space-y-3">
            {data.slice(0, 15).map((row) => (
              <div key={row.period} className="flex items-center gap-2 sm:gap-4">
                <span className="text-[10px] sm:text-xs text-gray-500 w-16 sm:w-24 flex-shrink-0 text-right font-mono">
                  {row.period}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 sm:h-8 overflow-hidden min-w-0">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full flex items-center justify-end pr-2 sm:pr-3 transition-all duration-500"
                    style={{ width: `${Math.max((row.revenue / maxRevenue) * 100, 2)}%` }}
                  >
                    {row.revenue > 0 && (
                      <span className="text-[10px] sm:text-xs font-bold text-white whitespace-nowrap">
                        Rs. {row.revenue.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-gray-400 w-10 sm:w-16 flex-shrink-0">
                  {row.transactions}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No data for this period
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.period} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-charcoal font-mono">
                      {row.period}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.transactions}</td>
                    <td className="px-6 py-4 text-sm text-charcoal">Rs. {row.charges.toFixed(0)}</td>
                    <td className="px-6 py-4 text-sm text-red-500">-Rs. {row.discounts.toFixed(0)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      Rs. {row.revenue.toFixed(0)}
                    </td>
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
