import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getPiSession } from "@/lib/pi-session";
import { getDb } from "@/db";
import { tickets } from "@/db/schema";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await getPiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;
  const db = getDb();

  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.qr_token, token))
    .limit(1);

  if (!ticket) {
    return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 });
  }

  if (ticket.used_at) {
    return NextResponse.json({ error: "Entrada ya utilizada", used_at: ticket.used_at }, { status: 409 });
  }

  await db
    .update(tickets)
    .set({ used_at: new Date() })
    .where(eq(tickets.qr_token, token));

  return NextResponse.json({ ok: true });
}
