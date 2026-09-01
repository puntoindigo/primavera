import { pgSchema, text, uuid, integer, timestamp } from "drizzle-orm/pg-core";

export const primavera = pgSchema("primavera");

export const tickets = primavera.table("tickets", {
  id:            uuid("id").defaultRandom().primaryKey(),
  mp_payment_id: text("mp_payment_id").unique(),
  first_name:    text("first_name"),
  last_name:     text("last_name"),
  email:         text("email"),
  amount:        integer("amount"),
  status:        text("status"),    // 'approved' | 'pending' | 'rejected'
  qr_token:      uuid("qr_token").defaultRandom().unique().notNull(),
  used_at:       timestamp("used_at"),
  created_at:    timestamp("created_at").defaultNow(),
});
