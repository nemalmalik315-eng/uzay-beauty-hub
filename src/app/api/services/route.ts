import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const now = new Date();
  const afterOctober2026 = now > new Date("2026-10-31T23:59:59");
  const { rows } = await db.execute(
    afterOctober2026
      ? "SELECT * FROM services WHERE active = 1 AND category != 'October Deals' ORDER BY category, price"
      : "SELECT * FROM services WHERE active = 1 ORDER BY category, price"
  );
  return NextResponse.json(rows);
}
