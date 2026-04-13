import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const services = db
    .prepare("SELECT * FROM services WHERE active = 1 ORDER BY category, price")
    .all();
  return NextResponse.json(services);
}
