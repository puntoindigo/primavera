import { getDb } from "@/db";
import { tickets } from "@/db/schema";
import { sql, count, sum, isNotNull } from "drizzle-orm";

function fmt(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default async function VentasPage() {
  const db = getDb();

  const [{ total, aprobados, recaudado, escaneados }] = await db
    .select({
      total:      count(),
      aprobados:  sql<number>`count(*) filter (where ${tickets.status} = 'approved')`,
      recaudado:  sql<number>`coalesce(sum(${tickets.amount}) filter (where ${tickets.status} = 'approved'), 0)`,
      escaneados: sql<number>`count(*) filter (where ${tickets.used_at} is not null)`,
    })
    .from(tickets);

  const rows = await db
    .select({
      id:           tickets.id,
      mp_payment_id: tickets.mp_payment_id,
      first_name:   tickets.first_name,
      last_name:    tickets.last_name,
      email:        tickets.email,
      amount:       tickets.amount,
      status:       tickets.status,
      used_at:      tickets.used_at,
      created_at:   tickets.created_at,
    })
    .from(tickets)
    .orderBy(sql`${tickets.created_at} desc`)
    .limit(200);

  const STATUS_COLOR: Record<string, string> = {
    approved: "var(--green)",
    pending:  "var(--accent)",
    rejected: "var(--red)",
  };

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Ventas</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Resumen de entradas vendidas</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total entradas", value: String(total) },
          { label: "Aprobadas",      value: String(aprobados) },
          { label: "Recaudado",      value: fmt(Number(recaudado)) },
          { label: "Escaneadas",     value: `${escaneados} / ${aprobados}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "1rem 1.25rem" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.25rem" }}>{label}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                {["Comprador", "Email", "Monto", "Estado", "Escaneado", "Fecha"].map((h) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, fontSize: "0.8rem", color: "var(--muted)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
                    No hay ventas aún.
                  </td>
                </tr>
              ) : rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", whiteSpace: "nowrap" }}>
                    {[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", color: "var(--muted)" }}>
                    {r.email ?? "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                    {r.amount != null ? fmt(r.amount) : "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ color: STATUS_COLOR[r.status ?? ""] ?? "var(--muted)", fontSize: "0.8rem", fontWeight: 600 }}>
                      {r.status ?? "—"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: r.used_at ? "var(--green)" : "var(--muted)" }}>
                    {r.used_at
                      ? new Date(r.used_at).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                      : "No"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
