import { buildLogoutUrl, buildLoginUrl } from "@/lib/auth-shared";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://primavera2026.puntoindigo.com";

export default function UnauthorizedPage() {
  // Logout primero para limpiar la cookie, luego login forzando reauth
  const switchUrl = buildLogoutUrl(
    buildLoginUrl(SITE_URL + "/admin", { reauth: true })
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>🚫</p>
        <h1 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Sin acceso</h1>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
          Tu cuenta no tiene permisos para ver este panel.
        </p>
        <a
          href={switchUrl}
          style={{
            display: "inline-block",
            background: "var(--accent)",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 8,
            padding: "0.65rem 1.75rem",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          Intentar con otra cuenta
        </a>
      </div>
    </div>
  );
}
