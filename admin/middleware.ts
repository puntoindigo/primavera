import { NextRequest, NextResponse } from "next/server";

const PI_COOKIE = "pi_session";
const ACCOUNTS_URL = process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? "https://accounts.puntoindigo.com";

export function middleware(req: NextRequest) {
  const hasCookie = !!req.cookies.get(PI_COOKIE)?.value;
  if (!hasCookie) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("redirect", req.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/check/:path*"],
};
