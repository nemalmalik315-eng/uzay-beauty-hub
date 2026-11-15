import { NextRequest, NextResponse } from "next/server";

// Routes that bypass auth entirely
const PUBLIC_ROUTES: { path: string; methods: string[] }[] = [
  { path: "/api/auth",     methods: ["GET", "POST", "DELETE"] },
  { path: "/api/bookings", methods: ["POST"] },          // public booking form
  { path: "/api/services", methods: ["GET"] },           // booking page reads services
  { path: "/admin/login",  methods: ["GET"] },
];

async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;

  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const payloadB64 = token.slice(0, dot);
  const sigHex = token.slice(dot + 1);
  if (!payloadB64 || !sigHex) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const expected = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payloadB64)
    );
    const expectedHex = Array.from(new Uint8Array(expected))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return sigHex === expectedHex;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // Allow public routes through immediately
  if (PUBLIC_ROUTES.some((r) => r.path === pathname && r.methods.includes(method))) {
    return NextResponse.next();
  }

  // Only guard /admin/* and /api/*
  const isAdminPage = pathname.startsWith("/admin/");
  const isApi = pathname.startsWith("/api/");
  if (!isAdminPage && !isApi) return NextResponse.next();

  const token = req.cookies.get("admin_token")?.value;
  const valid = token ? await verifyToken(token) : false;

  if (!valid) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
