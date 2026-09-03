import {
  pgSchema,
  text,
  uuid,
  integer,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const primavera = pgSchema("primavera");

/* ------------------------------------------------------------------ */
/* Organizadores                                                       */
/* ------------------------------------------------------------------ */

export const organizers = primavera.table("organizers", {
  id:          uuid("id").defaultRandom().primaryKey(),
  slug:        text("slug").notNull().unique(),
  name:        text("name").notNull(),
  legal_name:  text("legal_name"),
  tax_id:      text("tax_id"),                 // CUIT
  email:       text("email"),
  phone:       text("phone"),
  website:     text("website"),
  instagram:   text("instagram"),
  description: text("description"),
  logo_url:    text("logo_url"),
  // Cada organizador podra cobrar con su propia cuenta de MP.
  // Vacio => se usa MP_ACCESS_TOKEN del entorno.
  mp_access_token: text("mp_access_token"),
  created_at:  timestamp("created_at").defaultNow(),
  updated_at:  timestamp("updated_at").defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Equipo                                                              */
/* ------------------------------------------------------------------ */
// role: 'owner' | 'admin' | 'staff' | 'scanner'
//  owner   -> todo, incluye borrar el organizador y gestionar el equipo
//  admin   -> crea/edita eventos, ve ventas, gestiona equipo
//  staff   -> ve eventos y ventas, no edita
//  scanner -> solo escanea entradas en la puerta

export const team_members = primavera.table(
  "team_members",
  {
    id:           uuid("id").defaultRandom().primaryKey(),
    organizer_id: uuid("organizer_id").notNull().references(() => organizers.id, { onDelete: "cascade" }),
    email:        text("email").notNull(),
    name:         text("name"),
    role:         text("role").notNull().default("staff"),
    invited_by:   text("invited_by"),
    created_at:   timestamp("created_at").defaultNow(),
  },
  (t) => ({
    org_email_uq: uniqueIndex("team_members_org_email_uq").on(t.organizer_id, t.email),
    email_idx:    index("team_members_email_idx").on(t.email),
  })
);

/* ------------------------------------------------------------------ */
/* Eventos                                                             */
/* ------------------------------------------------------------------ */
// status: 'draft' | 'published' | 'finished' | 'cancelled'

export const events = primavera.table(
  "events",
  {
    id:            uuid("id").defaultRandom().primaryKey(),
    organizer_id:  uuid("organizer_id").notNull().references(() => organizers.id, { onDelete: "cascade" }),
    slug:          text("slug").notNull().unique(),
    name:          text("name").notNull(),
    tagline:       text("tagline"),
    description:   text("description"),
    cover_url:     text("cover_url"),
    venue_name:    text("venue_name"),
    venue_address: text("venue_address"),
    venue_city:    text("venue_city"),
    starts_at:     timestamp("starts_at"),
    ends_at:       timestamp("ends_at"),
    doors_at:      timestamp("doors_at"),
    capacity:      integer("capacity"),
    status:        text("status").notNull().default("draft"),
    terms:         text("terms"),
    created_at:    timestamp("created_at").defaultNow(),
    updated_at:    timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    organizer_idx: index("events_organizer_idx").on(t.organizer_id),
    status_idx:    index("events_status_idx").on(t.status),
  })
);

/* ------------------------------------------------------------------ */
/* Tipos de entrada (MVP: solo "general", sin lotes ni multifecha)     */
/* ------------------------------------------------------------------ */

export const ticket_types = primavera.table(
  "ticket_types",
  {
    id:              uuid("id").defaultRandom().primaryKey(),
    event_id:        uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    name:            text("name").notNull().default("General"),
    description:     text("description"),
    price:           integer("price").notNull(),          // ARS, entero
    service_fee:     integer("service_fee").notNull().default(0),
    quantity:        integer("quantity"),                 // null = sin cupo definido
    max_per_order:   integer("max_per_order").notNull().default(10),
    sales_start_at:  timestamp("sales_start_at"),
    sales_end_at:    timestamp("sales_end_at"),
    is_active:       boolean("is_active").notNull().default(true),
    created_at:      timestamp("created_at").defaultNow(),
    updated_at:      timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    event_idx: index("ticket_types_event_idx").on(t.event_id),
  })
);

/* ------------------------------------------------------------------ */
/* Ordenes de compra                                                   */
/* ------------------------------------------------------------------ */
// status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled'

export const orders = primavera.table(
  "orders",
  {
    id:                uuid("id").defaultRandom().primaryKey(),
    event_id:          uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    ticket_type_id:    uuid("ticket_type_id").references(() => ticket_types.id, { onDelete: "set null" }),
    quantity:          integer("quantity").notNull().default(1),
    unit_price:        integer("unit_price").notNull(),
    total_amount:      integer("total_amount").notNull(),
    buyer_first_name:  text("buyer_first_name"),
    buyer_last_name:   text("buyer_last_name"),
    buyer_email:       text("buyer_email"),
    buyer_phone:       text("buyer_phone"),
    buyer_doc:         text("buyer_doc"),
    status:            text("status").notNull().default("pending"),
    payment_provider:  text("payment_provider").notNull().default("mercadopago"),
    mp_preference_id:  text("mp_preference_id"),
    mp_payment_id:     text("mp_payment_id").unique(),
    paid_at:           timestamp("paid_at"),
    created_at:        timestamp("created_at").defaultNow(),
    updated_at:        timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    event_idx:  index("orders_event_idx").on(t.event_id),
    status_idx: index("orders_status_idx").on(t.status),
    email_idx:  index("orders_buyer_email_idx").on(t.buyer_email),
  })
);

/* ------------------------------------------------------------------ */
/* Entradas                                                            */
/* ------------------------------------------------------------------ */
// Tabla preexistente del evento Primavera 2026: las columnas nuevas son
// nullable a proposito para no romper las entradas ya vendidas.

export const tickets = primavera.table(
  "tickets",
  {
    id:             uuid("id").defaultRandom().primaryKey(),
    mp_payment_id:  text("mp_payment_id").unique(),
    first_name:     text("first_name"),
    last_name:      text("last_name"),
    email:          text("email"),
    amount:         integer("amount"),
    status:         text("status"),   // 'approved' | 'pending' | 'rejected'
    qr_token:       uuid("qr_token").defaultRandom().unique().notNull(),
    used_at:        timestamp("used_at"),
    created_at:     timestamp("created_at").defaultNow(),

    // --- multi-evento ---
    event_id:       uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
    order_id:       uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
    ticket_type_id: uuid("ticket_type_id").references(() => ticket_types.id, { onDelete: "set null" }),
    used_by:        text("used_by"),          // email del staff que valido
    ticket_number:  integer("ticket_number"), // 1..n dentro de la orden
  },
  (t) => ({
    event_idx: index("tickets_event_idx").on(t.event_id),
    order_idx: index("tickets_order_idx").on(t.order_id),
  })
);

/* ------------------------------------------------------------------ */
/* Escaneos (auditoria de puerta)                                      */
/* ------------------------------------------------------------------ */
// result: 'ok' | 'duplicate' | 'not_found' | 'wrong_event'

export const scans = primavera.table(
  "scans",
  {
    id:         uuid("id").defaultRandom().primaryKey(),
    ticket_id:  uuid("ticket_id").references(() => tickets.id, { onDelete: "set null" }),
    event_id:   uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
    qr_token:   text("qr_token"),
    result:     text("result").notNull(),
    scanned_by: text("scanned_by"),
    created_at: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    event_idx:  index("scans_event_idx").on(t.event_id),
    ticket_idx: index("scans_ticket_idx").on(t.ticket_id),
  })
);
