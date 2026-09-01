import { NextRequest, NextResponse } from "next/server";

const PI_COOKIE = "pi_session";
const ACCOUNTS_URL = process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? "https://accounts.puntoindigo.com";

export function middleware(req: NextRequest) {
  const hasCookie = !!req.cookies.get(PI_COOKIE)?.value;
  if (!hasCookie) {
    const loginUrl = `${ACCOUNTS_URL}/login?redirect=${encodeURIComponent(req.nextUrl.href)}`;
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/check/:path*"],
};
