import crypto from "crypto";

export interface PiSessionPayload {
  email:   string;
  name:    string | null;
  picture: string | null;
  exp:     number;
}

export const PI_COOKIE = "pi_session";

export function buildLoginUrl(redirectTo: string, options?: { reauth?: boolean }) {
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? "https://accounts.puntoindigo.com";
  const u = new URL(`${accountsUrl}/login`);
  u.searchParams.set("redirect", redirectTo);
  if (options?.reauth) u.searchParams.set("reauth", "1");
  return u.toString();
}

export function buildLogoutUrl(redirectTo: string) {
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? "https://accounts.puntoindigo.com";
  return `${accountsUrl}/api/auth/logout?next=${encodeURIComponent(redirectTo)}`;
}

export function verifyPiToken(token: string): PiSessionPayload | null {
  const secret = process.env.PI_SESSION_SECRET;
  if (!secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const toB64 = (buf: Buffer | string) =>
    (Buffer.isBuffer(buf) ? buf : Buffer.from(buf, "utf8"))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  const fromB64 = (s: string) => {
    const p = s.replace(/-/g, "+").replace(/_/g, "/");
    const pad = p.length % 4 ? 4 - (p.length % 4) : 0;
    return Buffer.from(p + "=".repeat(pad), "base64").toString("utf8");
  };
  const expected = toB64(crypto.createHmac("sha256", secret).update(body).digest());
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch { return null; }
  try {
    const p = JSON.parse(fromB64(body)) as PiSessionPayload;
    if (!p?.email || !p?.exp) return null;
    if (p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch { return null; }
}

export function isAdmin(email: string): boolean {
  return email.toLowerCase() === (process.env.ADMIN_EMAIL ?? "daeiman@gmail.com").toLowerCase();
}
