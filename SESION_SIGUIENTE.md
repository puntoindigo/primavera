# Estado de la sesión — administrador de eventos primavera2026

Checkpoint de continuidad. Si una sesión se traba, abrir una nueva en este repo
y pasarle este archivo como contexto. Ver también `status.md` (resumen corto).

**Última revisión contra código y commits:** 2026-10-08 (HEAD `fea3f25`).

## Pedido original (resumido)

Agregar a `/admin` un menú con todos los pasos para administrar eventos, como
semilla de un futuro administrador general multi-evento. Alcance guiado por el
análisis de competencia de Tikzet (ya entregado y cerrado).

**Dentro del alcance MVP:** autenticación, creación de evento, página pública
de evento, perfil de organizador, gestión de equipo, tipo de entrada único
"general", MercadoPago, generación de QR, dashboard de ventas, escaneo en la
puerta.

**Fuera de alcance por ahora:** lotes/tiers de entradas, eventos multifecha,
descuentos, campos personalizados.

## Decisiones tomadas

1. **MercadoPago directo, no vía Plata** (Plata no soporta precio variable en
   ARS ni `external_reference`). `organizers.mp_access_token` existe para que
   cada organizador cobre con su cuenta a futuro.
2. **Autenticación vía accounts.puntoindigo.com** (Google). Lo que se construye
   es la capa de autorización por roles (`team_members`).
3. **App duplicada `admin/` eliminada** (commit `029a8e1`): `/admin` lo sirve
   solo la app Next de la raíz.

## Infraestructura

- Repo `github.com/puntoindigo/primavera`, branch `main`. Next 15 + React 19,
  Drizzle + Neon Postgres (schema `primavera`), MercadoPago SDK, `qrcode`,
  `@vercel/blob`, `@vercel/analytics` + GA4. Deploy en Vercel (`vercel.json`).
- Tablas en Neon (ya aplicadas con `drizzle-kit push`): `organizers`,
  `team_members`, `events`, `ticket_types`, `orders`, `tickets`, `scans`.
- Env vars usadas: `DATABASE_URL`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`
  (opcional), `PI_SESSION_SECRET`, `ADMIN_EMAIL`, `NEXT_PUBLIC_SITE_URL`,
  token de Vercel Blob. Valores reales solo en Vercel.

## Pasos del MVP — estado real

| # | Paso | Estado | Dónde / commit |
|---|------|--------|----------------|
| 1 | Layout `/admin` con menú | ✅ Hecho | `app/admin/layout.tsx` (`5339580`) |
| 2 | CRUD de eventos (listado, alta, edición con tabs general/entradas/ventas/asistentes, imágenes a Blob) | ✅ Hecho | `app/admin/eventos/**` (`5d227a6`, `daf2144`) |
| 3 | Organizador: perfil + seed automático del primero (creador queda `owner`) + MP token propio | ✅ Hecho (sin logo) | `app/admin/organizador` (`a9bdec1`) |
| 4 | Equipo: alta de miembros con rol | 🟡 Parcial | `app/admin/equipo` — inserta en `team_members`, **no envía mail de invitación** |
| 5 | Página pública `/e/[slug]` | ✅ Hecho | `app/e/[slug]/page.tsx` (`f672549`) — la home `/` sigue sirviendo `public/landing.html` estático |
| 6 | Checkout MP parametrizado por `ticket_type_id` | 🟡 Parcial | `app/api/checkout` — cantidad fija 1, `external_reference` = ticket_type id (no order id), **no crea `orders`**, usa el `MP_ACCESS_TOKEN` global |
| 7 | Webhook MP con firma HMAC | 🟡 Parcial | `app/api/webhook/mp` (`b7b7aee`) — si falta `MP_WEBHOOK_SECRET` **acepta sin validar**; upsert por `mp_payment_id` evita duplicar con `/success` |
| 8 | QR de entrada | ✅ Hecho | `app/success` genera QR → `/check/[token]` |
| 9 | Escaneo en puerta | 🟡 Parcial | `app/admin/escanear` (`d634598`) — UI funciona, pero `/api/check/[token]` autoriza a **cualquier usuario logueado**; no usa `lib/roles.ts`, no filtra por evento, no registra en `scans` |
| 10 | Dashboard de ventas | ✅ Hecho (global) | `app/admin/ventas` (`e4b5812`) — lee `tickets`, no separa por evento |
| 11 | `@vercel/analytics` + GA4 | ✅ Hecho | `app/layout.tsx` (`b7b7aee`, `fea3f25`) |
| 12 | Retirar app duplicada `admin/` | ✅ Hecho | `029a8e1` |

## Brecha principal: pagos no se vinculan a eventos

El modelo `orders` / `tickets.event_id` / `tickets.order_id` existe en el schema
pero **ningún flujo lo escribe**: checkout no crea `orders`, y webhook/`success`
insertan `tickets` sin `event_id`, `order_id` ni `ticket_type_id`. Consecuencia:
las tabs **Ventas** y **Asistentes** de `/admin/eventos/[id]` quedan vacías para
compras reales; solo `/admin/ventas` (global) muestra datos. Este es el
pendiente de mayor valor.

## Pendiente real (orden sugerido)

1. Checkout: crear `order` (pending) antes de la preferencia y mandar
   `external_reference = order.id`; webhook/`success` marcan la orden pagada y
   crean el ticket con `event_id`, `order_id`, `ticket_type_id`.
2. `/api/check/[token]`: autorizar con `canScan()` sobre el organizador del
   evento del ticket, validar que el ticket sea del evento elegido y registrar
   en `scans`.
3. Gate general de `/admin`: hoy sigue siendo `isAdmin()` (`ADMIN_EMAIL`), así
   que los miembros de equipo no-superadmin no pueden entrar. Pasar a roles.
4. Webhook: rechazar si falta `MP_WEBHOOK_SECRET` (y confirmar que está
   seteado en Vercel).
5. Usar `organizers.mp_access_token` en checkout cuando exista.
6. Equipo: mail de invitación (hoy solo alta en DB).
7. Opcional: `/` → redirigir a `/e/<slug>` en vez del `landing.html` estático;
   logo de organizador.
8. Antes de cerrar: `npm run build` y chequeo de seguridad del ecosistema en
   verde (`security:check` no está en el `package.json` de este repo).

## Fuera de alcance (sin cambios)

Lotes/tiers, multifecha, descuentos, campos personalizados, cantidad > 1 por
compra.
