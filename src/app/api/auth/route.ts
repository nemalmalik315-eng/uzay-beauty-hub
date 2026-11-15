import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function signToken(payload: string): string {
  const secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
  const b64 = Buffer.from(payload).toString("base64");
  const sig = crypto.createHmac("sha256", secret).update(b64).digest("hex");
  return `${b64}.${sig}`;
}

function decodeToken(token: string): { id: string; username: string } | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const payloadB64 = token.slice(0, dot);
    const payload = Buffer.from(payloadB64, "base64").toString();
    const [id, username] = payload.split(":");
    if (!id || !username) return null;
    return { id, username };
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const { rows } = await db.execute({ sql: "SELECT * FROM admin_users WHERE username = ?", args: [username] });
  const user = rows[0] as unknown as { id: number; username: string; password_hash: string } | undefined;

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = bcrypt.compareSync(password, user.password_hash as string);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signToken(`${user.id}:${user.username}:${Date.now()}`);

  const response = NextResponse.json({ message: "Login successful", username: user.username });
  response.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.delete("admin_token");
  return response;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const decoded = decodeToken(token);
    if (decoded) {
      const { id, username } = decoded;
      const db = getDb();
      const { rows } = await db.execute({
        sql: "SELECT id FROM admin_users WHERE id = ? AND username = ?",
        args: [Number(id), username],
      });
      if (rows.length > 0) {
        return NextResponse.json({ authenticated: true, username });
      }
    }
  } catch {
    // invalid token
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
