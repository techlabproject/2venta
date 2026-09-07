import { pool, query } from "@/lib/db";

export type Message = {
  id: string;
  sender_id: string;
  body: string;
  redactions: string[];
  created_at: Date;
};

export type Offer = {
  id: string;
  offered_by: string;
  price_cop: number;
  status: "pendiente" | "aceptada" | "rechazada" | "vencida";
  expires_at: Date;
  created_at: Date;
};

export type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  listing_title: string;
  listing_price_cop: number;
};

/** Abre la conversación de ese comprador con ese artículo, o devuelve la que ya existe. */
export async function openConversation(
  listingId: string,
  buyerId: string,
  sellerId: string
): Promise<string> {
  const rows = await query<{ id: string }>(
    `insert into conversations (listing_id, buyer_id, seller_id)
     values ($1, $2, $3)
     on conflict (listing_id, buyer_id) do update set listing_id = excluded.listing_id
     returning id`,
    [listingId, buyerId, sellerId]
  );
  return rows[0].id;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID.test(id)) return null;
  const rows = await query<Conversation>(
    `select c.id, c.listing_id, c.buyer_id, c.seller_id,
            l.title as listing_title, l.price_cop as listing_price_cop
       from conversations c join listings l on l.id = c.listing_id
      where c.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export function listMessages(conversationId: string): Promise<Message[]> {
  return query<Message>(
    `select id::text, sender_id, body, redactions, created_at
       from messages where conversation_id = $1 order by created_at`,
    [conversationId]
  );
}

export function listOffers(conversationId: string): Promise<Offer[]> {
  return query<Offer>(
    `select id, offered_by, price_cop, status, expires_at, created_at
       from offers where conversation_id = $1 order by created_at desc`,
    [conversationId]
  );
}

export async function getOffer(id: string): Promise<(Offer & { listing_id: string; conversation_id: string }) | null> {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID.test(id)) return null;
  const rows = await query<Offer & { listing_id: string; conversation_id: string }>(
    `select id, offered_by, price_cop, status, expires_at, created_at,
            listing_id, conversation_id
       from offers where id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/** Marca vencidas las ofertas cuyo plazo pasó, antes de mostrarlas. */
export async function expireStaleOffers(conversationId: string): Promise<void> {
  await query(
    `update offers set status = 'vencida'
      where conversation_id = $1 and status = 'pendiente' and expires_at < now()`,
    [conversationId]
  );
}

export type Question = {
  id: string;
  body: string;
  answer: string | null;
  asker_alias: string;
  created_at: Date;
};

export function listQuestions(listingId: string): Promise<Question[]> {
  return query<Question>(
    `select q.id::text, q.body, q.answer,
            coalesce(u.alias, u.name) as asker_alias, q.created_at
       from questions q join "user" u on u.id = q.asker_id
      where q.listing_id = $1 order by q.created_at desc limit 20`,
    [listingId]
  );
}

export { pool };
