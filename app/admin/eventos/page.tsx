export default function EventosPage() {
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
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
        <p>Aún no hay eventos. Creá el primero con el botón de arriba.</p>
      </div>
    </div>
  );
}
