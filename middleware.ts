import { NextRequest, NextResponse } from "next/server";

const PI_COOKIE = "pi_session";

export function middleware(req: NextRequest) {
  const hasCookie = !!req.cookies.get(PI_COOKIE)?.value;
  if (!hasCookie) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    loginUrl.searchParams.set("redirect", req.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/check/:path*"],
};
