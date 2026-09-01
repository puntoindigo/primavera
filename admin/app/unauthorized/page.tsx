export default function UnauthorizedPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "1rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Acceso no autorizado</h1>
      <p style={{ color: "var(--muted)" }}>No tenés permisos para ver esta página.</p>
    </div>
  );
}
