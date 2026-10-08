# primavera — status

- **URL:** https://primavera2026.puntoindigo.com (`/` landing, `/e/[slug]` evento, `/admin` panel)
- **Repo:** github.com/puntoindigo/primavera
- **Stack:** Next 15 / React 19, Drizzle + Neon Postgres, MercadoPago Checkout Pro, Vercel (Blob, Analytics) + GA4, login vía accounts.puntoindigo.com
- **Estado (2026-10-08):** MVP del administrador de eventos mayormente hecho: CRUD de eventos, organizador, equipo, página pública, checkout MP, QR, escaneo y dashboard de ventas global.

## Pendientes

1. Vincular pagos a eventos: checkout no crea `orders`; los tickets se guardan sin `event_id`/`order_id` (tabs Ventas/Asistentes por evento quedan vacías).
2. Escaneo autoriza a cualquier usuario logueado; falta usar roles, filtrar por evento y registrar `scans`.
3. Acceso a `/admin` solo para `ADMIN_EMAIL`; falta gate por roles de equipo.
4. Webhook MP acepta sin firma si falta `MP_WEBHOOK_SECRET`.
5. Invitaciones de equipo sin mail; MP token por organizador sin usar.

Detalle completo en `SESION_SIGUIENTE.md`.
