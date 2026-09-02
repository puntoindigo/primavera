import { buildLoginUrl } from "@/lib/auth-shared";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://primavera2026.puntoindigo.com";

interface Props {
  searchParams: Promise<{ redirect?: string; reauth?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { redirect: redirectTo, reauth } = await searchParams;
  const destination = redirectTo ?? (SITE_URL + "/admin");
  const loginUrl = buildLoginUrl(destination, { reauth: !!reauth });

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
    }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "2.5rem 2rem",
        maxWidth: 360,
        width: "100%",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🌸</div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          Gran Fiesta de la Primavera 2026
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "2rem" }}>
          Acceso de administración
        </p>

        <a
          href={loginUrl}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.625rem",
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "0.75rem 1.25rem",
            fontSize: "0.9375rem",
            fontWeight: 500,
            color: "var(--text)",
            textDecoration: "none",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <GoogleIcon />
          Acceder con Google
        </a>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
