import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization");

  if (auth) {
    const [user, pass] = atob(auth.split(" ")[1]).split(":");
    if (user === "admin" && pass === process.env.ADMIN_PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Uzay Admin"' },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
