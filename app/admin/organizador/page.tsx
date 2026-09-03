import { getDb } from "@/db";
import { organizers, team_members } from "@/db/schema";
import { getPiSession } from "@/lib/pi-session";

async function guardarOrganizador(formData: FormData) {
  "use server";
  const session = await getPiSession();
  if (!session) return;

  const id          = (formData.get("id") as string | null) || null;
  const name        = (formData.get("name") as string)?.trim();
  const slug        = (formData.get("slug") as string)?.trim();
  const legal_name  = (formData.get("legal_name") as string)?.trim() || null;
  const tax_id      = (formData.get("tax_id") as string)?.trim() || null;
  const email       = (formData.get("email") as string)?.trim() || null;
  const phone       = (formData.get("phone") as string)?.trim() || null;
  const website     = (formData.get("website") as string)?.trim() || null;
  const instagram   = (formData.get("instagram") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const mp_access_token = (formData.get("mp_access_token") as string)?.trim() || null;

  if (!name || !slug) return;

  const db = getDb();
  if (id) {
    await db.update(organizers).set({ name, slug, legal_name, tax_id, email, phone, website, instagram, description, mp_access_token, updated_at: new Date() })
      .where((await import("drizzle-orm")).eq(organizers.id, id));
  } else {
    const [created] = await db.insert(organizers).values({ name, slug, legal_name, tax_id, email, phone, website, instagram, description, mp_access_token }).returning({ id: organizers.id });
    // Seed: registrar al superadmin como owner
    await db.insert(team_members).values({ organizer_id: created.id, email: session.email.toLowerCase(), name: session.name ?? null, role: "owner" });
  }
}

export default async function OrganizadorPage() {
  const db = getDb();
  // Asumimos que hay uno solo por ahora (Primavera 2026)
  const orgs = await db.select().from(organizers).limit(1);
  const org = orgs[0] ?? null;

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Perfil del organizador</h1>
      <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        {org ? "Editá los datos del organizador." : "Todavía no hay un organizador. Completá los datos para crear uno."}
      </p>

      <form action={guardarOrganizador} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {org && <input type="hidden" name="id" value={org.id} />}

        <Field label="Nombre del organizador *">
          <input name="name" required defaultValue={org?.name ?? ""} placeholder="Gran Fiesta de la Primavera" style={inputStyle} />
        </Field>

        <Field label="Slug (identificador URL) *">
          <input name="slug" required defaultValue={org?.slug ?? "primavera-2026"} pattern="[a-z0-9\-]+" style={inputStyle} />
          <small style={{ color: "var(--muted)" }}>Solo letras minúsculas, números y guiones.</small>
        </Field>

        <Field label="Razón social">
          <input name="legal_name" defaultValue={org?.legal_name ?? ""} style={inputStyle} />
        </Field>

        <Field label="CUIT">
          <input name="tax_id" defaultValue={org?.tax_id ?? ""} placeholder="20-12345678-9" style={inputStyle} />
        </Field>

        <Field label="Email de contacto">
          <input name="email" type="email" defaultValue={org?.email ?? ""} style={inputStyle} />
        </Field>

        <Field label="Teléfono">
          <input name="phone" defaultValue={org?.phone ?? ""} style={inputStyle} />
        </Field>

        <Field label="Sitio web">
          <input name="website" type="url" defaultValue={org?.website ?? ""} placeholder="https://..." style={inputStyle} />
        </Field>

        <Field label="Instagram">
          <input name="instagram" defaultValue={org?.instagram ?? ""} placeholder="@handle" style={inputStyle} />
        </Field>

        <Field label="Descripción">
          <textarea name="description" rows={3} defaultValue={org?.description ?? ""} style={{ ...inputStyle, resize: "vertical" }} />
        </Field>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

        <Field label="MercadoPago Access Token (opcional)">
          <input name="mp_access_token" type="password" defaultValue={org?.mp_access_token ?? ""} placeholder="APP_USR-..." style={inputStyle} />
          <small style={{ color: "var(--muted)" }}>Si no se completa, se usa el token global del servidor.</small>
        </Field>

        <button type="submit" style={{ background: "var(--accent)", color: "#fff", padding: "0.7rem 1.5rem", borderRadius: 6, fontSize: "0.9rem", fontWeight: 600, border: "none", cursor: "pointer", alignSelf: "flex-start" }}>
          {org ? "Guardar cambios" : "Crear organizador"}
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
