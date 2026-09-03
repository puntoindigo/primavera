import { getDb } from "@/db";
import { events } from "@/db/schema";
import { desc } from "drizzle-orm";
import ScannerClient from "./ScannerClient";

export default async function EscanearPage() {
  const db = getDb();
  const availableEvents = await db
    .select({ id: events.id, name: events.name })
    .from(events)
    .orderBy(desc(events.starts_at));

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Escanear entradas</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Validación de QR en la puerta del evento</p>
      </div>
      <ScannerClient events={availableEvents} />
    </div>
  );
}
