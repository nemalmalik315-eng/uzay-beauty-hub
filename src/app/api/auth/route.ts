import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  const { rows } = await db.execute({ sql: "SELECT * FROM admin_users WHERE username = ?", args: [username] });
  const user = rows[0] as { id: number; username: string; password_hash: string } | undefined;

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = bcrypt.compareSync(password, user.password_hash as string);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = Buffer.from(`${user.id}:${user.username}:${Date.now()}`).toString("base64");

  const response = NextResponse.json({ message: "Login successful", username: user.username });
  response.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: false,
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
    const decoded = Buffer.from(token, "base64").toString();
    const [id, username] = decoded.split(":");
    if (id && username) {
      return NextResponse.json({ authenticated: true, username });
    }
  } catch {
    // invalid token
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
