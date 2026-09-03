import { getDb } from "@/db";
import { team_members, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type Role = "owner" | "admin" | "staff" | "scanner";

/** Devuelve el rol de `email` dentro de `organizer_id`, o null si no es miembro. */
export async function getRoleInOrganizer(
  email: string,
  organizer_id: string
): Promise<Role | null> {
  const db = getDb();
  const rows = await db
    .select({ role: team_members.role })
    .from(team_members)
    .where(
      and(
        eq(team_members.email, email.toLowerCase()),
        eq(team_members.organizer_id, organizer_id)
      )
    )
    .limit(1);
  return (rows[0]?.role as Role) ?? null;
}

/** Devuelve el rol de `email` dentro del organizador del evento `event_id`. */
export async function getRoleInEvent(
  email: string,
  event_id: string
): Promise<Role | null> {
  const db = getDb();
  const ev = await db
    .select({ organizer_id: events.organizer_id })
    .from(events)
    .where(eq(events.id, event_id))
    .limit(1);
  if (!ev[0]) return null;
  return getRoleInOrganizer(email, ev[0].organizer_id);
}

/** True si `email` tiene al menos un rol (cualquiera) en el organizador. */
export async function isMember(
  email: string,
  organizer_id: string
): Promise<boolean> {
  return (await getRoleInOrganizer(email, organizer_id)) !== null;
}

/** True si `email` puede escanear: cualquier rol del equipo alcanza. */
export async function canScan(
  email: string,
  organizer_id: string
): Promise<boolean> {
  return isMember(email, organizer_id);
}

/** True si `email` puede administrar (owner o admin). */
export async function canAdmin(
  email: string,
  organizer_id: string
): Promise<boolean> {
  const role = await getRoleInOrganizer(email, organizer_id);
  return role === "owner" || role === "admin";
}
