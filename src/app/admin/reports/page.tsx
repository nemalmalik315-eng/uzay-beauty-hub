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
        <div className="bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 rounded-xl p-6">
          <h2 className="font-heading text-xl font-semibold text-charcoal mb-4">
            Today&apos;s Summary
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-3xl font-bold text-green-600">Rs. {today.revenue.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-3xl font-bold text-charcoal">{today.transactions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Discounts</p>
              <p className="text-3xl font-bold text-red-500">Rs. {today.discounts.toFixed(0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Period selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-2">
          {[
            { key: "daily", label: "Daily (30 days)" },
            { key: "weekly", label: "Weekly (90 days)" },
            { key: "monthly", label: "Monthly (1 year)" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setType(p.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === p.key
                  ? "bg-gold text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual bar chart */}
      {data.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-heading text-lg font-semibold text-charcoal mb-6">Revenue Overview</h3>
          <div className="space-y-3">
            {data.slice(0, 15).map((row) => (
              <div key={row.period} className="flex items-center gap-4">
                <span className="text-xs text-gray-500 w-24 flex-shrink-0 text-right font-mono">
                  {row.period}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{ width: `${Math.max((row.revenue / maxRevenue) * 100, 2)}%` }}
                  >
                    {row.revenue > 0 && (
                      <span className="text-xs font-bold text-white">
                        Rs. {row.revenue.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 w-16 flex-shrink-0">
                  {row.transactions} txn
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
    </div>
  );
}
