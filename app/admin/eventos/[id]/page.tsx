import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { events, organizers, ticket_types, orders, tickets } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

async function actualizarEvento(formData: FormData) {
  "use server";
  const id           = formData.get("event_id") as string;
  const name         = (formData.get("name") as string)?.trim();
  const tagline      = (formData.get("tagline") as string)?.trim() || null;
  const description  = (formData.get("description") as string)?.trim() || null;
  const venue_name   = (formData.get("venue_name") as string)?.trim() || null;
  const venue_address = (formData.get("venue_address") as string)?.trim() || null;
  const venue_city   = (formData.get("venue_city") as string)?.trim() || null;
  const starts_at_raw = formData.get("starts_at") as string | null;
  const ends_at_raw   = formData.get("ends_at") as string | null;
  const capacity_raw  = formData.get("capacity") as string | null;
  const status       = (formData.get("status") as string) ?? "draft";

  if (!id || !name) return;
  const db = getDb();
  await db.update(events).set({
    name, tagline, description, venue_name, venue_address, venue_city,
    starts_at: starts_at_raw ? new Date(starts_at_raw) : null,
    ends_at:   ends_at_raw   ? new Date(ends_at_raw)   : null,
    capacity:  capacity_raw  ? parseInt(capacity_raw, 10) : null,
    status,
    updated_at: new Date(),
  }).where(eq(events.id, id));

  // Redirect handled client-side via form action, no import needed — revalidatePath would work here
  // but we're avoiding extra imports; the browser will reload naturally on form submit.
}

async function actualizarTicketType(formData: FormData) {
  "use server";
  const tt_id         = formData.get("tt_id") as string;
  const price_raw     = formData.get("price") as string;
  const qty_raw       = formData.get("quantity") as string;
  const max_raw       = formData.get("max_per_order") as string;
  const is_active_raw = formData.get("is_active") as string | null;

  if (!tt_id) return;
  const db = getDb();
  await db.update(ticket_types).set({
    price:        parseInt(price_raw, 10),
    quantity:     qty_raw ? parseInt(qty_raw, 10) : null,
    max_per_order: parseInt(max_raw, 10),
    is_active:    is_active_raw === "on",
    updated_at:   new Date(),
  }).where(eq(ticket_types.id, tt_id));
}

async function crearTicketType(formData: FormData) {
  "use server";
  const event_id  = formData.get("event_id") as string;
  const name      = (formData.get("name") as string)?.trim() || "General";
  const price_raw = formData.get("price") as string;
  const qty_raw   = formData.get("quantity") as string;
  const max_raw   = formData.get("max_per_order") as string;

  if (!event_id || !price_raw) return;
  const db = getDb();
  await db.insert(ticket_types).values({
    event_id,
    name,
    price:         parseInt(price_raw, 10),
    quantity:      qty_raw ? parseInt(qty_raw, 10) : null,
    max_per_order: max_raw ? parseInt(max_raw, 10) : 10,
  });
}

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> };

export default async function EventoDetailPage({ params, searchParams }: PageProps) {
  const { id }   = await params;
  const { tab }  = await searchParams;
  const activeTab = tab ?? "general";

  const db = getDb();

  const [ev] = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  if (!ev) notFound();

  const [org] = await db
    .select({ name: organizers.name })
    .from(organizers)
    .where(eq(organizers.id, ev.organizer_id))
    .limit(1);

  const tts = await db
    .select()
    .from(ticket_types)
    .where(eq(ticket_types.event_id, id));

  // Stats
  const salesRows = await db
    .select({
      status: orders.status,
      total:  sql<number>`count(*)::int`,
      amount: sql<number>`coalesce(sum(${orders.total_amount}),0)::int`,
    })
    .from(orders)
    .where(eq(orders.event_id, id))
    .groupBy(orders.status);

  const salesByStatus = Object.fromEntries(salesRows.map((r) => [r.status, r]));
  const totalOrders    = salesRows.reduce((s, r) => s + r.total, 0);
  const approvedAmount = salesByStatus["approved"]?.amount ?? 0;
  const approvedCount  = salesByStatus["approved"]?.total ?? 0;

  // Asistentes
  const attendees = await db
    .select({ id: tickets.id, first_name: tickets.first_name, last_name: tickets.last_name, email: tickets.email, status: tickets.status, used_at: tickets.used_at, created_at: tickets.created_at, qr_token: tickets.qr_token })
    .from(tickets)
    .where(eq(tickets.event_id, id))
    .orderBy(desc(tickets.created_at));

  const fmtDate = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "—";

  const toDatetimeLocal = (d: Date | null | undefined) => {
    if (!d) return "";
    const dt = new Date(d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  };

  const tabLink = (t: string) => `/admin/eventos/${id}?tab=${t}`;

  const TABS = [
    { key: "general",   label: "General" },
    { key: "entradas",  label: "Entradas" },
    { key: "ventas",    label: "Ventas" },
    { key: "asistentes", label: "Asistentes" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <a href="/admin/eventos" style={{ color: "var(--muted)", fontSize: "0.875rem", textDecoration: "none" }}>← Eventos</a>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.25rem" }}>{ev.name}</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: 2 }}>{org?.name ?? "—"} · <code style={{ fontSize: "0.8rem" }}>/e/{ev.slug}</code></p>
        </div>
        <StatusBadge status={ev.status} />
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Órdenes totales" value={String(totalOrders)} />
        <StatCard label="Ventas aprobadas" value={String(approvedCount)} />
        <StatCard label="Monto aprobado" value={`$${approvedAmount.toLocaleString("es-AR")}`} color="var(--green)" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem" }}>
        {TABS.map((t) => (
          <a
            key={t.key}
            href={tabLink(t.key)}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: activeTab === t.key ? 600 : 400,
              color: activeTab === t.key ? "var(--accent)" : "var(--muted)",
              borderBottom: activeTab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              textDecoration: "none",
              marginBottom: -1,
            }}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* --- TAB: GENERAL --- */}
      {activeTab === "general" && (
        <form action={actualizarEvento} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 640 }}>
          <input type="hidden" name="event_id" value={ev.id} />

          <Field label="Nombre *">
            <input name="name" required defaultValue={ev.name} style={inputStyle} />
          </Field>
          <Field label="Tagline">
            <input name="tagline" defaultValue={ev.tagline ?? ""} style={inputStyle} />
          </Field>
          <Field label="Descripción">
            <textarea name="description" rows={5} defaultValue={ev.description ?? ""} style={{ ...inputStyle, resize: "vertical" }} />
          </Field>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

          <Field label="Nombre del lugar">
            <input name="venue_name" defaultValue={ev.venue_name ?? ""} style={inputStyle} />
          </Field>
          <Field label="Dirección">
            <input name="venue_address" defaultValue={ev.venue_address ?? ""} style={inputStyle} />
          </Field>
          <Field label="Ciudad">
            <input name="venue_city" defaultValue={ev.venue_city ?? ""} style={inputStyle} />
          </Field>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Fecha inicio">
              <input name="starts_at" type="datetime-local" defaultValue={toDatetimeLocal(ev.starts_at)} style={inputStyle} />
            </Field>
            <Field label="Fecha fin">
              <input name="ends_at" type="datetime-local" defaultValue={toDatetimeLocal(ev.ends_at)} style={inputStyle} />
            </Field>
          </div>

          <Field label="Capacidad">
            <input name="capacity" type="number" min="1" defaultValue={ev.capacity ?? ""} style={inputStyle} />
          </Field>

          <Field label="Estado">
            <select name="status" defaultValue={ev.status} style={inputStyle}>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="finished">Terminado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </Field>

          <button type="submit" style={btnStyle}>Guardar cambios</button>
        </form>
      )}

      {/* --- TAB: ENTRADAS --- */}
      {activeTab === "entradas" && (
        <div style={{ maxWidth: 640 }}>
          {tts.map((tt) => (
            <form key={tt.id} action={actualizarTicketType} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
              <input type="hidden" name="tt_id" value={tt.id} />
              <h3 style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 0 }}>{tt.name}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <Field label="Precio (ARS)">
                  <input name="price" type="number" min="0" defaultValue={tt.price} style={inputStyle} />
                </Field>
                <Field label="Cupo total">
                  <input name="quantity" type="number" min="1" defaultValue={tt.quantity ?? ""} placeholder="Sin límite" style={inputStyle} />
                </Field>
                <Field label="Máx. por orden">
                  <input name="max_per_order" type="number" min="1" defaultValue={tt.max_per_order} style={inputStyle} />
                </Field>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                <input name="is_active" type="checkbox" defaultChecked={tt.is_active} />
                Venta activa
              </label>
              <button type="submit" style={{ ...btnStyle, alignSelf: "flex-start", padding: "0.4rem 1rem", fontSize: "0.8rem" }}>Guardar</button>
            </form>
          ))}

          {/* Crear tipo de entrada */}
          <details style={cardStyle}>
            <summary style={{ fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", marginBottom: "1rem" }}>
              + Agregar tipo de entrada
            </summary>
            <form action={crearTicketType} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              <input type="hidden" name="event_id" value={ev.id} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <Field label="Nombre">
                  <input name="name" defaultValue="General" style={inputStyle} />
                </Field>
                <Field label="Precio (ARS) *">
                  <input name="price" type="number" min="0" required style={inputStyle} />
                </Field>
                <Field label="Cupo total">
                  <input name="quantity" type="number" min="1" placeholder="Sin límite" style={inputStyle} />
                </Field>
              </div>
              <Field label="Máx. por orden">
                <input name="max_per_order" type="number" min="1" defaultValue="10" style={{ ...inputStyle, maxWidth: 120 }} />
              </Field>
              <button type="submit" style={{ ...btnStyle, alignSelf: "flex-start" }}>Crear tipo de entrada</button>
            </form>
          </details>
        </div>
      )}

      {/* --- TAB: VENTAS --- */}
      {activeTab === "ventas" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            {["pending", "approved", "rejected", "cancelled"].map((s) => {
              const r = salesByStatus[s];
              return <StatCard key={s} label={STATUS_LABEL_ORDER[s] ?? s} value={String(r?.total ?? 0)} />;
            })}
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Vista detallada de órdenes — próximamente.
          </p>
        </div>
      )}

      {/* --- TAB: ASISTENTES --- */}
      {activeTab === "asistentes" && (
        <div style={{ overflowX: "auto" }}>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "1rem" }}>
            {attendees.length} entradas registradas · {attendees.filter((a) => a.used_at).length} usadas
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                {["Nombre", "Email", "Estado pago", "Entrada", "Fecha compra", ""].map((h) => (
                  <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, fontSize: "0.8rem", color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendees.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>Sin asistentes aún.</td></tr>
              )}
              {attendees.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>{a.first_name ?? "—"} {a.last_name ?? ""}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}>{a.email ?? "—"}</td>
                  <td style={{ padding: "0.75rem 1rem" }}><StatusBadgeTicket status={a.status ?? ""} /></td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {a.used_at ? (
                      <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Usada {fmtDate(a.used_at)}</span>
                    ) : (
                      <span style={{ color: "var(--green)", fontSize: "0.8rem" }}>Válida</span>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--muted)" }}>{fmtDate(a.created_at)}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <a href={`/check/${a.qr_token}`} target="_blank" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none" }}>Ver QR</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const STATUS_LABEL_ORDER: Record<string, string> = {
  pending: "Pendientes", approved: "Aprobadas", rejected: "Rechazadas", cancelled: "Canceladas",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    draft:     { label: "Borrador",  color: "var(--muted)"  },
    published: { label: "Publicado", color: "var(--green)"  },
    finished:  { label: "Terminado", color: "var(--accent)" },
    cancelled: { label: "Cancelado", color: "var(--red)"    },
  };
  const s = map[status] ?? { label: status, color: "var(--muted)" };
  return (
    <span style={{ background: s.color + "22", color: s.color, padding: "0.25rem 0.75rem", borderRadius: 999, fontWeight: 600, fontSize: "0.8rem" }}>
      {s.label}
    </span>
  );
}

function StatusBadgeTicket({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    approved: { label: "Aprobado", color: "var(--green)"  },
    pending:  { label: "Pendiente", color: "var(--yellow)" },
    rejected: { label: "Rechazado", color: "var(--red)"   },
  };
  const s = map[status] ?? { label: status || "—", color: "var(--muted)" };
  return <span style={{ color: s.color, fontWeight: 600, fontSize: "0.8rem" }}>{s.label}</span>;
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "1.25rem" }}>
      <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "0.25rem" }}>{label}</p>
      <p style={{ fontSize: "1.75rem", fontWeight: 700, color: color ?? "var(--text)" }}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.375rem", fontSize: "0.875rem", fontWeight: 500 }}>
      {label}
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: "0.875rem",
  background: "var(--surface)",
  color: "var(--text)",
  width: "100%",
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  background: "var(--accent)", color: "#fff",
  padding: "0.65rem 1.25rem", borderRadius: 6,
  fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer",
};

const cardStyle: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: 8, padding: "1.25rem",
};
