import { cookies } from "next/headers";
import { PI_COOKIE, verifyPiToken, type PiSessionPayload } from "./auth-shared";

export type { PiSessionPayload };
export { PI_COOKIE, verifyPiToken, isAdmin, buildLoginUrl, buildLogoutUrl } from "./auth-shared";

export async function getPiSession(): Promise<PiSessionPayload | null> {
  const secret = process.env.PI_SESSION_SECRET;
  if (!secret) return null;
  const jar = await cookies();
  const value = jar.get(PI_COOKIE)?.value;
  if (!value) return null;
  return verifyPiToken(value);
}
