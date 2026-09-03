export default function EscanearPage() {
  return (
    <div>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Escanear entradas</h1>
      <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "2rem" }}>Validación de QR en la puerta del evento</p>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
        <p>Próximamente: escáner de QR para staff autorizado.</p>
      </div>
    </div>
  );
}
