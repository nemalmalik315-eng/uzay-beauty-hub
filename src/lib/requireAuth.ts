import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", JWT_SECRET).update(payloadB64).digest("hex");
  return expected === sig;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
