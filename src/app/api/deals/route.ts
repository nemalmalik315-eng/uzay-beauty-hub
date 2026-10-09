import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

const OCTOBER_DEALS = [
  {
    name: "October Deal 01",
    services: ["Face Cleansing", "Skin Polish with Deep Neck", "Scrubbing", "Hand & Feet Polisher", "Shoulder Massage"],
    price: 1550,
    color: "#C0614A",
  },
  {
    name: "October Deal 02",
    services: ["Herbal or Ice Cool Facial", "Skin Polish", "Hair Trim", "Shoulder Massage", "Hand & Feet Polisher", "Upper Lip Threading"],
    price: 2450,
    color: "#7050B8",
  },
  {
    name: "October Deal 03",
    services: ["Super Relaxing Whitening Facial", "Whitening Polisher", "Manual Scrubber", "Roller & Gua Sha Massage", "Whitening Manicure + Pedicure", "Half Arm Wax"],
    price: 4800,
    color: "#2A8A5C",
  },
  {
    name: "October Deal 04",
    services: ["Whitening Manicure + Pedicure", "Face Cleansing", "Half Arm Wax", "Half Legs Wax", "Hair Wash with Protein Mask", "Finger Dry"],
    price: 3500,
    color: "#2E6CB0",
  },
];

async function seedDeals() {
  const db = getDb();
  try { await db.execute("ALTER TABLE services ADD COLUMN description TEXT"); } catch { /* exists */ }
  for (const deal of OCTOBER_DEALS) {
    const { rows } = await db.execute({
      sql: "SELECT id FROM services WHERE name = ? AND category = 'October Deals'",
      args: [deal.name],
    });
    if (rows.length === 0) {
      await db.execute({
        sql: "INSERT INTO services (name, category, price, description, active, duration) VALUES (?, 'October Deals', ?, ?, 1, 0)",
        args: [deal.name, deal.price, deal.services.join(" · ")],
      });
    }
  }
}

export async function GET() {
  const now = new Date();
  const isOctober2026 = now.getFullYear() === 2026 && now.getMonth() === 9;
  if (!isOctober2026) return NextResponse.json([]);

  await seedDeals();

  const db = getDb();
  const { rows } = await db.execute(
    "SELECT id, name, price, description FROM services WHERE category = 'October Deals' AND active = 1 ORDER BY name ASC"
  );

  return NextResponse.json(
    rows.map((row) => {
      const meta = OCTOBER_DEALS.find((d) => d.name === String(row.name));
      return {
        id: Number(row.id),
        name: String(row.name),
        price: Number(row.price),
        description: String(row.description ?? ""),
        color: meta?.color ?? "#C9A84C",
        services: meta?.services ?? [],
      };
    })
  );
}
