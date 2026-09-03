import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { events, organizers, ticket_types } from "@/db/schema";

type Props = { params: Promise<{ slug: string }> };

export default async function EventoPublicoPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();

  const [ev] = await db
    .select({
      id:            events.id,
      name:          events.name,
      tagline:       events.tagline,
      description:   events.description,
      cover_url:     events.cover_url,
      venue_name:    events.venue_name,
      venue_address: events.venue_address,
      venue_city:    events.venue_city,
      starts_at:     events.starts_at,
      ends_at:       events.ends_at,
      status:        events.status,
      organizer_id:  events.organizer_id,
      terms:         events.terms,
    })
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1);

  if (!ev || ev.status === "draft") notFound();

  const [org, tts] = await Promise.all([
    db
      .select({ name: organizers.name, instagram: organizers.instagram, website: organizers.website })
      .from(organizers)
      .where(eq(organizers.id, ev.organizer_id))
      .limit(1)
      .then(r => r[0] ?? null),
    db
      .select({ id: ticket_types.id, name: ticket_types.name, description: ticket_types.description, price: ticket_types.price, quantity: ticket_types.quantity })
      .from(ticket_types)
      .where(eq(ticket_types.event_id, ev.id)),
  ]);

  const fmt = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : null;
  const fmtTime = (d: Date | null) =>
    d ? new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : null;

  const startDate = fmt(ev.starts_at);
  const startTime = fmtTime(ev.starts_at);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      {/* Cover */}
      {ev.cover_url && (
        <div style={{ width: "100%", height: 280, background: "#111", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ev.cover_url} alt={ev.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
        </div>
      )}

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1.25rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          {ev.status === "finished" && (
            <span style={{ display: "inline-block", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: 4, padding: "0.15rem 0.6rem", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.75rem" }}>
              EVENTO FINALIZADO
            </span>
          )}
          <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2.25rem)", fontWeight: 800, lineHeight: 1.15, marginBottom: "0.5rem" }}>
            {ev.name}
          </h1>
          {ev.tagline && (
            <p style={{ fontSize: "1.1rem", color: "var(--muted)", marginBottom: "1rem" }}>{ev.tagline}</p>
          )}

          {/* Info chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.875rem" }}>
            {startDate && (
              <Chip icon="📅" text={`${startDate}${startTime ? ` · ${startTime}` : ""}`} />
            )}
            {(ev.venue_name || ev.venue_city) && (
              <Chip icon="📍" text={[ev.venue_name, ev.venue_city].filter(Boolean).join(" · ")} />
            )}
            {ev.venue_address && (
              <Chip icon="🗺" text={ev.venue_address} />
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
          {/* Descripción */}
          {ev.description && (
            <Section title="Sobre el evento">
              <p style={{ color: "var(--muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{ev.description}</p>
            </Section>
          )}

          {/* Entradas */}
          {tts.length > 0 && ev.status === "published" && (
            <Section title="Entradas">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {tts.map(tt => (
                  <div key={tt.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontWeight: 700 }}>{tt.name}</p>
                      {tt.description && <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{tt.description}</p>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                        {tt.price === 0 ? "Gratis" : `$${tt.price.toLocaleString("es-AR")}`}
                      </span>
                      <a
                        href={`/api/checkout?ticket_type_id=${tt.id}`}
                        style={{
                          background: "var(--accent)",
                          color: "#fff",
                          textDecoration: "none",
                          borderRadius: 6,
                          padding: "0.55rem 1.1rem",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Comprar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Términos */}
          {ev.terms && (
            <Section title="Términos y condiciones">
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{ev.terms}</p>
            </Section>
          )}

          {/* Organizador */}
          {org && (
            <Section title="Organizado por">
              <p style={{ fontWeight: 600 }}>{org.name}</p>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.4rem", fontSize: "0.875rem" }}>
                {org.website && <a href={org.website} style={{ color: "var(--accent)" }} target="_blank" rel="noopener noreferrer">Sitio web</a>}
                {org.instagram && <a href={`https://instagram.com/${org.instagram.replace("@", "")}`} style={{ color: "var(--accent)" }} target="_blank" rel="noopener noreferrer">@{org.instagram.replace("@", "")}</a>}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, text }: { icon: string; text: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "0.25rem 0.75rem" }}>
      <span>{icon}</span>
      <span style={{ color: "var(--text)" }}>{text}</span>
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "0.75rem" }}>{title}</h2>
      {children}
    </div>
  );
}
