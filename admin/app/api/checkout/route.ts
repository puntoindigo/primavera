import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { getMpClient } from "@/lib/mp";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://primavera-admin.puntoindigo.com";
const WEBHOOK_URL = `${ADMIN_URL}/api/webhook/mp`;

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
        notification_url: WEBHOOK_URL,
        back_urls: {
          success: `${ADMIN_URL}/success`,
          failure: `${ADMIN_URL}/success`,
          pending: `${ADMIN_URL}/success`,
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
