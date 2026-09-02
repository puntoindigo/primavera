export default function UnauthorizedPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>🚫</p>
        <h1 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Sin acceso</h1>
        <p style={{ color: "var(--muted)" }}>Tu cuenta no tiene permisos para ver este panel.</p>
        <a href="/admin/login" style={{ display: "inline-block", marginTop: "1.5rem", color: "var(--accent)" }}>
          Iniciar sesión con otra cuenta
        </a>
      </div>
    </div>
  );
}
