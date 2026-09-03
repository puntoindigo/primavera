import { NextRequest, NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { eq } from "drizzle-orm";
import { getMpClient } from "@/lib/mp";
import { getDb } from "@/db";
import { events, ticket_types } from "@/db/schema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://primavera2026.puntoindigo.com";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ticketTypeId = url.searchParams.get("ticket_type_id");

    let title = "Entrada — Gran Fiesta de la Primavera 2026";
    let price = 25000;

    if (ticketTypeId) {
      const db = getDb();
      const [tt] = await db
        .select({
          name:       ticket_types.name,
          price:      ticket_types.price,
          event_id:   ticket_types.event_id,
        })
        .from(ticket_types)
        .where(eq(ticket_types.id, ticketTypeId))
        .limit(1);

      if (!tt) {
        return NextResponse.json({ error: "Tipo de entrada no encontrado" }, { status: 404 });
      }

      const [ev] = await db
        .select({ name: events.name })
        .from(events)
        .where(eq(events.id, tt.event_id))
        .limit(1);

      title = ev ? `${ev.name} — ${tt.name}` : tt.name;
      price = tt.price;
    }

    const client = getMpClient();
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: ticketTypeId ?? "entrada-primavera-2026",
            title,
            quantity: 1,
            unit_price: price,
            currency_id: "ARS",
          },
        ],
        notification_url: `${SITE_URL}/api/webhook/mp`,
        back_urls: {
          success: `${SITE_URL}/success`,
          failure: `${SITE_URL}/success`,
          pending: `${SITE_URL}/success`,
        },
        auto_return: "approved",
        external_reference: ticketTypeId ?? undefined,
      },
    });

    return NextResponse.redirect(result.init_point!);
  } catch (err) {
    console.error("[checkout] Error creating preference:", err);
    return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 });
  }
}
