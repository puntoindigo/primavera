import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { Payment } from "mercadopago";
import { getMpClient } from "@/lib/mp";
import { getDb } from "@/db";
import { tickets } from "@/db/schema";

function verifyMpSignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // skip if not configured

  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";

  const parts: Record<string, string> = {};
  for (const part of xSignature.split(",")) {
    const [k, v] = part.trim().split("=", 2);
    if (k && v) parts[k] = v;
  }
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // MP manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>
  let dataId = "";
  try {
    dataId = String(JSON.parse(rawBody)?.data?.id ?? "");
  } catch {
    return false;
  }
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts}`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    if (!verifyMpSignature(req, rawBody)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

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
