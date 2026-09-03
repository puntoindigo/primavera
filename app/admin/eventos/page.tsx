import { getDb } from "@/db";
import { events } from "@/db/schema";
import { desc } from "drizzle-orm";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:     { label: "Borrador",  color: "var(--muted)" },
  published: { label: "Publicado", color: "var(--green)" },
  finished:  { label: "Terminado", color: "var(--accent)" },
  cancelled: { label: "Cancelado", color: "var(--red)" },
};

export default async function EventosPage() {
  const db = getDb();
  const rows = await db
    .select({
      id:         events.id,
      slug:       events.slug,
      name:       events.name,
      status:     events.status,
      starts_at:  events.starts_at,
      venue_city: events.venue_city,
    })
    .from(events)
    .orderBy(desc(events.created_at));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Eventos</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Creá y administrá tus eventos</p>
        </div>
        <a
          href="/admin/eventos/nuevo"
          style={{
            background: "var(--accent)", color: "#fff",
            padding: "0.5rem 1rem", borderRadius: 6,
            fontSize: "0.875rem", textDecoration: "none", fontWeight: 600,
          }}
        >
          + Nuevo evento
        </a>
      </div>

      {rows.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
          <p>Aún no hay eventos. Creá el primero con el botón de arriba.</p>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                {["Evento", "Estado", "Fecha", "Ciudad", ""].map((h) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, fontSize: "0.8rem", color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((ev) => {
                const st = STATUS_LABEL[ev.status] ?? { label: ev.status, color: "var(--muted)" };
                return (
                  <tr key={ev.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{ev.name}</p>
                      <p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>/{ev.slug}</p>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ color: st.color, fontWeight: 600, fontSize: "0.8rem" }}>{st.label}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--muted)" }}>
                      {ev.starts_at ? new Date(ev.starts_at).toLocaleDateString("es-AR") : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--muted)" }}>
                      {ev.venue_city ?? "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <a href={`/admin/eventos/${ev.id}`} style={{ fontSize: "0.8rem", color: "var(--accent)" }}>Editar →</a>
                      <a href={`/e/${ev.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Ver pública ↗</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
