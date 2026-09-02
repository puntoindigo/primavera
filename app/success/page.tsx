import { Payment } from "mercadopago";
import QRCode from "qrcode";
import { getMpClient } from "@/lib/mp";
import { getDb } from "@/db";
import { tickets } from "@/db/schema";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://primavera2026.puntoindigo.com";

interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const paymentId = sp.payment_id ?? sp.collection_id ?? null;
  const status = sp.status ?? sp.collection_status ?? null;

  if (!paymentId || status !== "approved") {
    return <ErrorMessage message="No se pudo verificar el pago. Si ya pagaste, guardá tu número de transacción y escribinos." />;
  }

  try {
    const client = getMpClient();
    const paymentAPI = new Payment(client);
    const payment = await paymentAPI.get({ id: paymentId });

    if (!payment || payment.status !== "approved") {
      return <ErrorMessage message="El pago no fue aprobado. Si esto es un error, escribinos." />;
    }

    const db = getDb();
    const [ticket] = await db
      .insert(tickets)
      .values({
        mp_payment_id: String(payment.id),
        first_name:    payment.payer?.first_name ?? null,
        last_name:     payment.payer?.last_name  ?? null,
        email:         payment.payer?.email       ?? null,
        amount:        payment.transaction_amount ? Math.round(payment.transaction_amount) : null,
        status:        payment.status,
      })
      .onConflictDoUpdate({
        target: tickets.mp_payment_id,
        set: { status: payment.status },
      })
      .returning();

    const checkUrl = `${SITE_URL}/check/${ticket.qr_token}`;
    const qrDataUrl = await QRCode.toDataURL(checkUrl, { width: 300, margin: 2 });

    const name = [payment.payer?.first_name, payment.payer?.last_name].filter(Boolean).join(" ") || "Comprador";

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg)" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "2.5rem", maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            ¡Pago confirmado, {name}!
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "2rem" }}>
            Esta es tu entrada para la Gran Fiesta de la Primavera 2026. Guardá este QR — lo necesitás en la puerta.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Código QR de entrada" style={{ width: 220, height: 220, margin: "0 auto 1.5rem" }} />
          <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
            ID de transacción: {paymentId}
          </p>
        </div>
      </div>
    );
  } catch (err) {
    console.error("[success] Error:", err);
    return <ErrorMessage message="Ocurrió un error al procesar tu pago. Guardá tu número de transacción y escribinos." />;
  }
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "2.5rem", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Atención</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>{message}</p>
        <a href="/" style={{ display: "inline-block", background: "var(--accent)", color: "#fff", textDecoration: "none", borderRadius: 8, padding: "0.65rem 1.75rem", fontWeight: 600, fontSize: "0.9rem" }}>
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
