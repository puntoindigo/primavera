# Estado de la sesión — administrador de eventos primavera2026

Checkpoint de continuidad. Si una sesión de Claude Code se traba (autocompact
fallando por sesión muy larga), abrir una nueva sesión en este repo y pasarle
este archivo como contexto — reemplaza cualquier resumen automático perdido.

## Pedido original (verbatim, resumido)

Agregar a `/admin` un menú con todos los pasos para administrar eventos,
construyendo la herramienta completa dentro de primavera2026 como semilla de
un futuro administrador general de eventos (multi-evento). Alcance guiado por
el doc de competencia de Tikzet (`/home/diego/tikzet-analisis.html`, ya
entregado y cerrado).

**Dentro del alcance MVP:** autenticación, creación de evento, página pública
de evento, perfil de organizador, gestión de equipo, tipo de entrada único
"general" (sin lotes/multifecha), MercadoPago, generación de QR, dashboard de
ventas, escaneo de entradas en la puerta.

**Fuera de alcance por ahora:** lotes/tiers de entradas, eventos multifecha,
descuentos, campos personalizados.

**Modo:** avanzar en auto mode sin preguntar salvo bloqueo real.

## Decisiones ya tomadas y comunicadas al usuario

1. **MercadoPago directo, no vía Plata.** Plata tiene catálogo de productos
   fijo en USD cents pensado para suscripciones — no puede expresar precio
   variable por evento en ARS, cantidad, ni el `external_reference` que
   necesitamos para linkear pago→orden→entradas. `organizers.mp_access_token`
   queda en el schema para que cada organizador cobre con su propia cuenta MP
   a futuro.
2. **Autenticación vía accounts.puntoindigo.com** (ya intermedia Google) — lo
   que hay que construir es la capa de **autorización** (roles por evento vía
   `team_members`), no cambiar cómo se autentica la gente.

## Infraestructura

- Repo: `/home/diego/projects/primavera`, remote `github.com/puntoindigo/primavera`,
  branch `main`. `git config user.email` = `daeiman@gmail.com` ✓.
- Vercel: proyecto `primavera` (`.vercel/project.json` en la raíz) sirve
  (presumiblemente) `primavera2026.puntoindigo.com`. Hay un proyecto Vercel
  **separado** para el subdirectorio `admin/` (`prj_JoYWTBzpfO8Q4yjMWslvrKoiO5UD`)
  que es una app Next casi duplicada — no se tocó, falta confirmar con el
  usuario si conviene retirarlo y cuál de los dos sirve realmente
  `/admin` hoy en producción.
- DB: Neon compartido, schema Postgres `primavera` (ver `db/schema.ts`).
  **`drizzle-kit push` ya se corrió y aplicó** — todas las tablas nuevas
  existen en Neon: `organizers`, `team_members`, `events`, `ticket_types`,
  `orders`, `scans`, más columnas nuevas en `tickets`.
- `.env.local` tiene placeholders `[SENSITIVE]` para `DATABASE_URL`,
  `MP_ACCESS_TOKEN`, `PI_SESSION_SECRET`, `ADMIN_EMAIL` (vercel env pull no
  trae secrets) — para comandos locales que los necesiten, pasarlos inline o
  regenerar el archivo con los valores reales.

## Hecho en esta sesión (esta tanda)

- `db/schema.ts` comprometido a git (ya estaba aplicado en Neon, faltaba el commit).
- `lib/roles.ts` — resolución de roles por organizador vía `team_members`
  (fundamento para autorizar `/admin/escanear` y futuras rutas por evento;
  el gate general de `/admin` sigue usando `isAdmin()`/`ADMIN_EMAIL` como
  superadmin porque todavía no existe ningún organizador/evento creado desde
  la UI para asignar membresías reales).
- `app/admin/layout.tsx` — shell con menú de navegación (Dashboard, Eventos,
  Organizador, Equipo, Escanear) + `UserMenu`, sesión verificada una sola vez.
- `app/admin/page.tsx` simplificado a solo contenido (stats + tabla), ya no
  duplica header/sesión (ahora vive en el layout).
- Páginas placeholder creadas para que el menú no rompa: `app/admin/eventos`,
  `app/admin/organizador`, `app/admin/equipo`, `app/admin/escanear`.

## Pendiente (próximos pasos, en orden sugerido)

1. CRUD de eventos real: `app/admin/eventos/page.tsx` (listado),
   `app/admin/eventos/nuevo/page.tsx` (alta), `app/admin/eventos/[id]/page.tsx`
   (edición + tabs entradas/ventas/asistencias).
2. Seed de un `organizer` inicial (el propio "Gran Fiesta de la Primavera
   2026") para poder asociarle eventos y miembros de equipo.
3. Página pública de evento `/e/[slug]` (reemplaza/complementa el
   `public/landing.html` estático servido hoy por `app/route.ts`).
4. Perfil de organizador (`/admin/organizador`) — editar datos, logo, MP
   token propio opcional.
5. Gestión de equipo (`/admin/equipo`) — invitar por email, asignar rol
   (owner/admin/staff/scanner), usa `team_members`.
6. Checkout MP parametrizado por evento/tipo de entrada real (`external_reference`
   = order id), reemplazando el checkout genérico actual.
7. Webhook MP: agregar validación de firma, evitar duplicar creación de
   ticket entre webhook y `/success`.
8. `/admin/escanear` funcional usando `lib/roles.ts` (cualquier rol del
   equipo puede escanear) en vez de "cualquier usuario logueado" como hoy en
   `/api/check/[token]`.
9. Agregar `@vercel/analytics` a `package.json` (convención del ecosistema).
10. Antes de cerrar: `npm run security:check -- --site=primavera` en verde.
11. Confirmar con el usuario cuál proyecto Vercel sirve realmente
    `primavera2026.puntoindigo.com/admin` y si conviene dar de baja el
    duplicado en `admin/`.

## Nota sobre autocompact

El usuario preguntó si documentar-y-compactar es una estrategia válida ante
errores de autocompact — sí, es exactamente este archivo. Si vuelve a fallar,
abrir sesión nueva y pasarle este archivo en vez de seguir empujando una
sesión larga.
