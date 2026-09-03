import { redirect } from "next/navigation";
import { getPiSession, isAdmin, buildLogoutUrl } from "@/lib/pi-session";
import UserMenu from "@/components/UserMenu";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://primavera2026.puntoindigo.com";

const NAV = [
  { href: "/admin",            label: "Dashboard" },
  { href: "/admin/eventos",    label: "Eventos" },
  { href: "/admin/organizador",label: "Organizador" },
  { href: "/admin/equipo",     label: "Equipo" },
  { href: "/admin/ventas",     label: "Ventas" },
  { href: "/admin/escanear",   label: "Escanear" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getPiSession();
  if (!session || !isAdmin(session.email)) redirect("/admin/unauthorized");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 1.5rem", height: 56,
        borderBottom: "1px solid var(--border)", background: "var(--surface)",
      }}>
        <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", marginRight: "1rem", color: "var(--accent)" }}>
            🌸 Primavera
          </span>
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              style={{
                padding: "0.375rem 0.75rem",
                borderRadius: 6,
                fontSize: "0.875rem",
                color: "var(--text)",
                textDecoration: "none",
              }}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <UserMenu
          name={session.name ?? null}
          email={session.email}
          picture={session.picture ?? null}
          logoutUrl={buildLogoutUrl(SITE_URL + "/admin")}
        />
      </header>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
        {children}
      </main>
    </div>
  );
}
