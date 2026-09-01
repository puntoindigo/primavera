import { NextRequest, NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { getMpClient } from "@/lib/mp";
import { getDb } from "@/db";
import { tickets } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // MercadoPago IPN format: { type: "payment", data: { id: "..." }, action: "payment.updated" }
    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ ok: true });
    }

    const paymentId = String(body.data.id);

    const client = getMpClient();
    const paymentAPI = new Payment(client);
    const payment = await paymentAPI.get({ id: paymentId });

    if (!payment || payment.status !== "approved") {
      return NextResponse.json({ ok: true });
    }

    const db = getDb();
    await db
      .insert(tickets)
      .values({
        mp_payment_id: paymentId,
        first_name:    payment.payer?.first_name ?? null,
        last_name:     payment.payer?.last_name  ?? null,
        email:         payment.payer?.email       ?? null,
        amount:        payment.transaction_amount ? Math.round(payment.transaction_amount) : null,
        status:        payment.status,
      })
      .onConflictDoUpdate({
        target: tickets.mp_payment_id,
        set: {
          first_name: payment.payer?.first_name ?? null,
          last_name:  payment.payer?.last_name  ?? null,
          email:      payment.payer?.email       ?? null,
          amount:     payment.transaction_amount ? Math.round(payment.transaction_amount) : null,
          status:     payment.status,
        },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/mp] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
