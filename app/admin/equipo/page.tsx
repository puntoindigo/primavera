import { getDb } from "@/db";
import { organizers, team_members } from "@/db/schema";
import { getPiSession } from "@/lib/pi-session";
import { eq } from "drizzle-orm";

async function invitarMiembro(formData: FormData) {
  "use server";
  const session = await getPiSession();
  if (!session) return;

  const organizer_id = formData.get("organizer_id") as string;
  const email        = (formData.get("email") as string)?.trim().toLowerCase();
  const name         = (formData.get("name") as string)?.trim() || null;
  const role         = (formData.get("role") as string) ?? "staff";

  if (!organizer_id || !email) return;
  const db = getDb();
  await db.insert(team_members)
    .values({ organizer_id, email, name, role, invited_by: session.email })
    .onConflictDoUpdate({
      target: [team_members.organizer_id, team_members.email],
      set: { role, name },
    });
}

async function eliminarMiembro(formData: FormData) {
  "use server";
  const id = formData.get("member_id") as string;
  if (!id) return;
  const db = getDb();
  const { eq } = await import("drizzle-orm");
  await db.delete(team_members).where(eq(team_members.id, id));
}

const ROLE_LABEL: Record<string, string> = {
  owner:   "Propietario",
  admin:   "Admin",
  staff:   "Staff",
  scanner: "Escáner",
};

export default async function EquipoPage() {
  const db = getDb();

  const orgs = await db.select({ id: organizers.id, name: organizers.name }).from(organizers).limit(1);
  const org = orgs[0] ?? null;

  const members = org
    ? await db
        .select()
        .from(team_members)
        .where(eq(team_members.organizer_id, org.id))
    : [];

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Equipo</h1>

      {!org && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--red)", borderRadius: 8, padding: "1rem", color: "var(--red)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Primero configurá un organizador en la pestaña Organizador.
        </div>
      )}

      {org && (
        <>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            Miembros de <strong>{org.name}</strong>. Podés dar acceso a escaner, staff o admins.
          </p>

          {/* Lista de miembros */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", marginBottom: "2rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                  {["Nombre / Email", "Rol", "Invitado por", ""].map((h) => (
                    <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600, fontSize: "0.8rem", color: "var(--muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
                      Sin miembros. Invitá al primero abajo.
                    </td>
                  </tr>
                )}
                {members.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{m.name ?? "—"}</p>
                      <p style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{m.email}</p>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{
                        background: m.role === "owner" ? "var(--accent)22" : "var(--surface)",
                        color: m.role === "owner" ? "var(--accent)" : "var(--muted)",
                        border: "1px solid var(--border)",
                        padding: "0.2rem 0.6rem", borderRadius: 999,
                        fontWeight: 600, fontSize: "0.75rem",
                      }}>
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--muted)" }}>{m.invited_by ?? "—"}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {m.role !== "owner" && (
                        <form action={eliminarMiembro}>
                          <input type="hidden" name="member_id" value={m.id} />
                          <button type="submit" style={{ background: "none", border: "none", color: "var(--red)", fontSize: "0.8rem", cursor: "pointer", padding: 0 }}>
                            Quitar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Formulario de invitación */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Agregar miembro</h2>
            <form action={invitarMiembro} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="hidden" name="organizer_id" value={org.id} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Email *">
                  <input name="email" type="email" required placeholder="persona@email.com" style={inputStyle} />
                </Field>
                <Field label="Nombre (opcional)">
                  <input name="name" placeholder="Nombre del miembro" style={inputStyle} />
                </Field>
              </div>
              <Field label="Rol">
                <select name="role" style={inputStyle}>
                  <option value="scanner">Escáner — solo escanea entradas en la puerta</option>
                  <option value="staff">Staff — ve eventos y ventas</option>
                  <option value="admin">Admin — crea/edita eventos y gestiona equipo</option>
                </select>
              </Field>
              <button type="submit" style={{ background: "var(--accent)", color: "#fff", padding: "0.65rem 1.25rem", borderRadius: 6, fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer", alignSelf: "flex-start" }}>
                Agregar al equipo
              </button>
            </form>
          </div>
        </>
      )}
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
  background: "var(--bg)",
  color: "var(--text)",
  width: "100%",
  boxSizing: "border-box",
};
