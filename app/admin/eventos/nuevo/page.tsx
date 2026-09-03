import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { events, organizers } from "@/db/schema";
import { eq } from "drizzle-orm";

async function crearEvento(formData: FormData) {
  "use server";

  const name       = (formData.get("name") as string | null)?.trim() ?? "";
  const slug       = (formData.get("slug") as string | null)?.trim() ?? "";
  const tagline    = (formData.get("tagline") as string | null)?.trim() || null;
  const description = (formData.get("description") as string | null)?.trim() || null;
  const venue_name = (formData.get("venue_name") as string | null)?.trim() || null;
  const venue_address = (formData.get("venue_address") as string | null)?.trim() || null;
  const venue_city = (formData.get("venue_city") as string | null)?.trim() || null;
  const starts_at_raw = formData.get("starts_at") as string | null;
  const ends_at_raw   = formData.get("ends_at") as string | null;
  const capacity_raw  = formData.get("capacity") as string | null;
  const status     = (formData.get("status") as string | null) ?? "draft";
  const organizer_id = formData.get("organizer_id") as string;

  if (!name || !slug || !organizer_id) return;

  const db = getDb();
  const [ev] = await db.insert(events).values({
    name,
    slug,
    tagline,
    description,
    venue_name,
    venue_address,
    venue_city,
    starts_at: starts_at_raw ? new Date(starts_at_raw) : null,
    ends_at:   ends_at_raw   ? new Date(ends_at_raw)   : null,
    capacity:  capacity_raw  ? parseInt(capacity_raw, 10) : null,
    status,
    organizer_id,
  }).returning({ id: events.id });

  redirect(`/admin/eventos/${ev.id}`);
}

export default async function NuevoEventoPage() {
  const db = getDb();
  const orgs = await db
    .select({ id: organizers.id, name: organizers.name })
    .from(organizers);

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <a href="/admin/eventos" style={{ color: "var(--muted)", fontSize: "0.875rem", textDecoration: "none" }}>← Volver a eventos</a>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "0.5rem" }}>Nuevo evento</h1>
      </div>

      <form action={crearEvento} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {orgs.length === 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--red)", borderRadius: 8, padding: "1rem", color: "var(--red)", fontSize: "0.875rem" }}>
            No hay organizadores creados. Primero configurá el perfil del organizador.
          </div>
        )}

        <Field label="Organizador *">
          <select name="organizer_id" required style={inputStyle}>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </Field>

        <Field label="Nombre del evento *">
          <input name="name" required placeholder="Gran Fiesta de la Primavera 2026" style={inputStyle} />
        </Field>

        <Field label="Slug (URL) *">
          <input name="slug" required placeholder="primavera-2026" pattern="[a-z0-9\-]+" style={inputStyle} />
          <small style={{ color: "var(--muted)" }}>Solo letras minúsculas, números y guiones. Ej: primavera-2026</small>
        </Field>

        <Field label="Tagline">
          <input name="tagline" placeholder="La fiesta del año" style={inputStyle} />
        </Field>

        <Field label="Descripción">
          <textarea name="description" rows={4} placeholder="Contá de qué se trata el evento..." style={{ ...inputStyle, resize: "vertical" }} />
        </Field>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

        <Field label="Nombre del lugar">
          <input name="venue_name" placeholder="Centro Cultural San Martín" style={inputStyle} />
        </Field>

        <Field label="Dirección">
          <input name="venue_address" placeholder="Av. Corrientes 1530" style={inputStyle} />
        </Field>

        <Field label="Ciudad">
          <input name="venue_city" placeholder="Buenos Aires" style={inputStyle} />
        </Field>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Field label="Fecha de inicio">
            <input name="starts_at" type="datetime-local" style={inputStyle} />
          </Field>
          <Field label="Fecha de fin">
            <input name="ends_at" type="datetime-local" style={inputStyle} />
          </Field>
        </div>

        <Field label="Capacidad (personas)">
          <input name="capacity" type="number" min="1" placeholder="500" style={inputStyle} />
        </Field>

        <Field label="Estado inicial">
          <select name="status" style={inputStyle}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
        </Field>

        <button
          type="submit"
          disabled={orgs.length === 0}
          style={{
            background: "var(--accent)", color: "#fff",
            padding: "0.75rem 1.5rem", borderRadius: 6,
            fontSize: "0.9rem", fontWeight: 600, border: "none", cursor: "pointer",
            opacity: orgs.length === 0 ? 0.4 : 1,
          }}
        >
          Crear evento
        </button>
      </form>
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
