import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { getMpClient } from "@/lib/mp";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://primavera2026.puntoindigo.com";

export async function GET() {
  try {
    const client = getMpClient();
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: "entrada-primavera-2026",
            title: "Entrada — Gran Fiesta de la Primavera 2026",
            quantity: 1,
            unit_price: 25000,
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
      },
    });

    return NextResponse.redirect(result.init_point!);
  } catch (err) {
    console.error("[checkout] Error creating preference:", err);
    return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 });
  }
}
