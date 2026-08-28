import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

function parseServiceNames(raw: string): string[] {
  if (raw.includes("|||") || raw.includes("~~")) {
    return raw.split("|||").map((p) => p.split("~~")[0]?.trim()).filter(Boolean);
  }
  return raw.split(" + ").map((s) => s.trim()).filter(Boolean);
}

function mostFrequent(arr: string[]): string {
  const counts: Record<string, number> = {};
  for (const s of arr) counts[s] = (counts[s] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

function buildMessage(name: string, hasPattern: boolean, commonService: string): string {
  const svc = commonService.toLowerCase();
  if (hasPattern && commonService) {
    return `Hi ${name}! 🌸 Just checking in — it looks like it's been a while since your last ${svc} at Uzay Beauty Hub. Ready to book your next session? We'd love to see you! 💄\n\nBook at uzaybeautyhub.com or WhatsApp us anytime.`;
  }
  return `Hi ${name}! 💄 It's been a while since your last visit at Uzay Beauty Hub and we miss you! Come back and treat yourself — we have some lovely services waiting for you. 🌸\n\nBook at uzaybeautyhub.com or just reply here!`;
}

export async function GET() {
  const db = getDb();

  // Get all billing records per customer, ordered by date
  const { rows } = await db.execute(`
    SELECT
      c.id, c.name, c.phone,
      b.created_at,
      b.service_name
    FROM customers c
    JOIN billing b ON b.customer_id = c.id
    WHERE c.phone IS NOT NULL AND c.phone != ''
    ORDER BY c.id, b.created_at ASC
  `);

  // Group by customer
  const customerMap: Record<number, {
    id: number; name: string; phone: string;
    visits: { date: string; services: string[] }[];
  }> = {};

  for (const row of rows) {
    const id = Number(row.id);
    if (!customerMap[id]) {
      customerMap[id] = { id, name: String(row.name), phone: String(row.phone), visits: [] };
    }
    customerMap[id].visits.push({
      date: String(row.created_at).slice(0, 10),
      services: parseServiceNames(String(row.service_name)),
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = [];

  for (const c of Object.values(customerMap)) {
    // Deduplicate by date (same as visit counting)
    const byDate: Record<string, string[]> = {};
    for (const v of c.visits) {
      if (!byDate[v.date]) byDate[v.date] = [];
      byDate[v.date].push(...v.services);
    }
    const uniqueDates = Object.keys(byDate).sort();
    if (uniqueDates.length === 0) continue;

    const lastVisit = new Date(uniqueDates[uniqueDates.length - 1] + "T00:00:00");
    const daysSince = Math.floor((today.getTime() - lastVisit.getTime()) / 86400000);

    // Compute gaps between consecutive visits
    let avgGapDays = 0;
    let hasPattern = false;

    if (uniqueDates.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < uniqueDates.length; i++) {
        const a = new Date(uniqueDates[i - 1] + "T00:00:00");
        const b = new Date(uniqueDates[i] + "T00:00:00");
        gaps.push(Math.round((b.getTime() - a.getTime()) / 86400000));
      }
      avgGapDays = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);

      if (uniqueDates.length >= 3) {
        const stdDev = Math.sqrt(
          gaps.reduce((s, g) => s + Math.pow(g - avgGapDays, 2), 0) / gaps.length
        );
        // Pattern is clear if std deviation < 40% of avg gap
        hasPattern = stdDev < avgGapDays * 0.4;
      }
    }

    // Determine if overdue
    const overdueThreshold = hasPattern
      ? avgGapDays + 7   // 1 week past their usual rhythm
      : 60;              // 2 months fallback

    if (daysSince < overdueThreshold) continue;

    // Most common service across all their visits
    const allServices = Object.values(byDate).flat();
    const commonService = mostFrequent(allServices);

    result.push({
      id: c.id,
      name: c.name,
      phone: c.phone,
      lastVisit: uniqueDates[uniqueDates.length - 1],
      daysSince,
      hasPattern,
      avgGapDays,
      commonService,
      message: buildMessage(c.name, hasPattern, commonService),
    });
  }

  // Sort: most overdue first
  result.sort((a, b) => b.daysSince - a.daysSince);

  return NextResponse.json(result);
}
