import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { isAuthenticated, unauthorized } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = new URL(req.url).searchParams.get("admin") === "1";
  if (admin && !isAuthenticated(req)) return unauthorized();

  const db = getDb();
  const { rows } = await db.execute(
    admin
      ? "SELECT * FROM deals ORDER BY collection, id"
      : "SELECT * FROM deals WHERE active = 1 ORDER BY collection, id"
  );

  // Fetch collections for color + date range
  const { rows: colRows } = await db.execute("SELECT * FROM deal_collections");
  const colMap = new Map(
    colRows.map((c) => [String(c.name), {
      id: Number(c.id),
      color: String(c.color ?? "#C9A84C"),
      start_date: c.start_date ? String(c.start_date) : null,
      end_date: c.end_date ? String(c.end_date) : null,
    }])
  );

  // Fetch services for price lookups
  const { rows: svcRows } = await db.execute("SELECT id, name, price FROM services WHERE active = 1");
  const svcMap = new Map(svcRows.map((s) => [Number(s.id), { name: String(s.name), price: Number(s.price) }]));

  const today = new Date().toISOString().split("T")[0];

  const deals = rows.map((row) => {
    const colName = String(row.collection);
    const col = colMap.get(colName);
    const serviceIds: number[] = JSON.parse(String(row.service_ids || "[]"));
    const services = serviceIds.map((id) => svcMap.get(id)).filter(Boolean) as { name: string; price: number }[];
    const originalPrice = services.reduce((sum, s) => sum + s.price, 0);
    const discountPercent = row.discount_percent ? Number(row.discount_percent) : null;
    const customPrice = row.custom_price ? Number(row.custom_price) : null;
    const finalPrice = customPrice ?? (discountPercent ? Math.round(originalPrice * (1 - discountPercent / 100)) : originalPrice);

    return {
      id: Number(row.id),
      collection: colName,
      collection_id: col?.id ?? null,
      color: col?.color ?? "#C9A84C",
      start_date: col?.start_date ?? null,
      end_date: col?.end_date ?? null,
      name: String(row.name),
      service_ids: serviceIds,
      services,
      original_price: originalPrice,
      discount_percent: discountPercent,
      custom_price: customPrice,
      final_price: finalPrice,
      active: Number(row.active) === 1,
      created_at: String(row.created_at ?? ""),
    };
  });

  if (admin) return NextResponse.json(deals);

  // For clients: only return deals whose collection date range includes today
  const activeDeal = deals.filter((d) => {
    const col = colMap.get(d.collection);
    if (!col) return true; // no date restriction
    const afterStart = !col.start_date || today >= col.start_date;
    const beforeEnd = !col.end_date || today <= col.end_date;
    return afterStart && beforeEnd;
  });

  return NextResponse.json(activeDeal);
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  const { collection, name, service_ids, discount_percent, custom_price } = await req.json();
  if (!collection?.trim() || !name?.trim()) {
    return NextResponse.json({ error: "collection and name are required" }, { status: 400 });
  }
  const db = getDb();
  await db.execute({
    sql: "INSERT INTO deals (collection, name, service_ids, discount_percent, custom_price) VALUES (?, ?, ?, ?, ?)",
    args: [
      collection.trim(),
      name.trim(),
      JSON.stringify(service_ids ?? []),
      discount_percent ?? null,
      custom_price ?? null,
    ],
  });
  return NextResponse.json({ ok: true });
}
