import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { isAuthenticated, unauthorized } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

// GET: public → active deals with service details; ?admin=1 → all deals
export async function GET(req: NextRequest) {
  const admin = new URL(req.url).searchParams.get("admin") === "1";
  if (admin && !isAuthenticated(req)) return unauthorized();

  const db = getDb();
  const { rows } = await db.execute(
    admin
      ? "SELECT * FROM deals ORDER BY collection, id"
      : "SELECT * FROM deals WHERE active = 1 ORDER BY collection, id"
  );

  // Fetch all services once so we can join
  const { rows: svcRows } = await db.execute(
    "SELECT id, name, price, price_max FROM services WHERE active = 1"
  );
  const svcMap = new Map(
    svcRows.map((s) => [Number(s.id), { name: String(s.name), price: Number(s.price), price_max: s.price_max ? Number(s.price_max) : null }])
  );

  return NextResponse.json(
    rows.map((row) => {
      const serviceIds: number[] = JSON.parse(String(row.service_ids || "[]"));
      const services = serviceIds.map((id) => svcMap.get(id)).filter(Boolean);
      const originalPrice = services.reduce((sum, s) => sum + (s!.price), 0);
      const discountPercent = row.discount_percent ? Number(row.discount_percent) : null;
      const customPrice = row.custom_price ? Number(row.custom_price) : null;
      const finalPrice = customPrice ?? (discountPercent ? Math.round(originalPrice * (1 - discountPercent / 100)) : originalPrice);

      return {
        id: Number(row.id),
        collection: String(row.collection),
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
    })
  );
}

// POST: create a new deal (admin only)
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
