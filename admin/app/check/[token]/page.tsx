import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tickets } from "@/db/schema";
import CheckClient from "./CheckClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function CheckPage({ params }: Props) {
  const { token } = await params;

  const db = getDb();
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.qr_token, token))
    .limit(1);

  if (!ticket) notFound();

  return (
    <CheckClient
      token={token}
      firstName={ticket.first_name}
      lastName={ticket.last_name}
      email={ticket.email}
      alreadyUsed={ticket.used_at !== null}
      usedAt={ticket.used_at ? ticket.used_at.toISOString() : null}
    />
  );
}
