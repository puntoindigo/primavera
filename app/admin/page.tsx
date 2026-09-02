import { redirect } from "next/navigation";
import { getPiSession, isAdmin, buildLogoutUrl } from "@/lib/pi-session";
import { getDb } from "@/db";
import { tickets } from "@/db/schema";
import { desc } from "drizzle-orm";
import UserMenu from "@/components/UserMenu";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://primavera2026.puntoindigo.com";

export default async function DashboardPage() {
  const session = await getPiSession();
  if (!session || !isAdmin(session.email)) redirect("/admin/unauthorized");

  const db = getDb();
  const rows = await db.select().from(tickets).orderBy(desc(tickets.created_at));

  const total = rows.length;
  const approved = rows.filter((r) => r.status === "approved").length;
  const used = rows.filter((r) => r.used_at !== null).length;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Gran Fiesta de la Primavera 2026</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Panel de administración</p>
        </div>
        <UserMenu
          name={session.name ?? null}
          email={session.email}
          picture={session.picture ?? null}
          logoutUrl={buildLogoutUrl(SITE_URL + "/admin")}
        />
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard label="Tickets totales" value={total} />
        <StatCard label="Pagos aprobados" value={approved} color="var(--green)" />
        <StatCard label="Entradas usadas" value={used} color="var(--accent)" />
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
              {["Nombre", "Email", "Monto", "Estado pago", "Entrada", "Fecha", "Acciones"].map((h) => (
                <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, fontSize: "0.8rem", color: "var(--muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
                  Aún no hay pagos registrados.
                </td>
              </tr>
            )}
            {rows.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.75rem 1rem" }}>
                  {t.first_name ?? "—"} {t.last_name ?? ""}
                </td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}>{t.email ?? "—"}</td>
                <td style={{ padding: "0.75rem 1rem" }}>{t.amount ? `$${t.amount.toLocaleString("es-AR")}` : "—"}</td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <StatusBadge status={t.status ?? ""} />
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  {t.used_at ? (
                    <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                      Usada {new Date(t.used_at).toLocaleDateString("es-AR")}
                    </span>
                  ) : (
                    <span style={{ color: "var(--green)", fontSize: "0.8rem" }}>Válida</span>
                  )}
                </td>
                <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--muted)" }}>
                  {t.created_at ? new Date(t.created_at).toLocaleDateString("es-AR") : "—"}
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <a
                    href={`/check/${t.qr_token}`}
                    style={{ fontSize: "0.8rem", color: "var(--accent)" }}
                  >
                    Ver entrada
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "1.25rem" }}>
      <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "0.25rem" }}>{label}</p>
      <p style={{ fontSize: "2rem", fontWeight: 700, color: color ?? "var(--text)" }}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    approved: { label: "Aprobado", color: "var(--green)" },
    pending:  { label: "Pendiente", color: "var(--yellow)" },
    rejected: { label: "Rechazado", color: "var(--red)" },
  };
  const s = map[status] ?? { label: status || "—", color: "var(--muted)" };
  return <span style={{ color: s.color, fontWeight: 600, fontSize: "0.8rem" }}>{s.label}</span>;
}
