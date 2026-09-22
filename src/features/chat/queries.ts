import { pool, query } from "@/lib/db";

export type Message = {
  id: string;
  sender_id: string;
  /** Nulo cuando el mensaje es solo una foto (S-37). */
  body: string | null;
  redactions: string[];
  /** Clave del bucket, nunca una dirección: se arma con `mediaUrl()` al pintar. */
  image_path: string | null;
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
  listing_poster_path: string;
  listing_status: string;
  buyer_alias: string;
  seller_alias: string;
};

/** Abre la conversación de ese comprador con ese artículo, o devuelve la que ya existe. */
export async function openConversation(
  listingId: string,
  buyerId: string,
  sellerId: string,
): Promise<string> {
  const rows = await query<{ id: string }>(
    `insert into conversations (listing_id, buyer_id, seller_id)
     values ($1, $2, $3)
     on conflict (listing_id, buyer_id) do update set listing_id = excluded.listing_id
     returning id`,
    [listingId, buyerId, sellerId],
  );
  return rows[0].id;
}

/** La conversación de esta compradora sobre este artículo, si ya existe. */
export async function findConversation(
  listingId: string,
  buyerId: string,
): Promise<string | null> {
  const rows = await query<{ id: string }>(
    `select id from conversations where listing_id = $1 and buyer_id = $2`,
    [listingId, buyerId],
  );
  return rows[0]?.id ?? null;
}

/**
 * Sobre qué artículos se puede empezar una conversación nueva.
 *
 * Solo sobre lo que está a la venta o reservado (quien lo reservó necesita
 * coordinar la entrega). Sobre uno vendido o retirado no hay nada que preguntar,
 * y abrir un chat vacío con «Hacer una oferta» prometía una compra imposible
 * (Luna, corrección 1, 2026-09-22). Las conversaciones que ya existían se siguen
 * abriendo: son la evidencia de lo que se acordó.
 */
export const ESTADOS_PARA_ESCRIBIR = ["activa", "reservada"];

export async function getConversation(
  id: string,
): Promise<Conversation | null> {
  const UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID.test(id)) return null;
  const rows = await query<Conversation>(
    `select c.id, c.listing_id, c.buyer_id, c.seller_id,
            l.title as listing_title, l.price_cop as listing_price_cop,
            l.poster_path as listing_poster_path, l.status as listing_status,
            coalesce(b.alias, b.name) as buyer_alias,
            coalesce(s.alias, s.name) as seller_alias
       from conversations c
       join listings l on l.id = c.listing_id
       join "user" b   on b.id = c.buyer_id
       join "user" s   on s.id = c.seller_id
      where c.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export function listMessages(conversationId: string): Promise<Message[]> {
  return query<Message>(
    `select id::text, sender_id, body, redactions, image_path, created_at
       from messages where conversation_id = $1 order by created_at`,
    [conversationId],
  );
}

export function listOffers(conversationId: string): Promise<Offer[]> {
  return query<Offer>(
    `select id, offered_by, price_cop, status, expires_at, created_at
       from offers where conversation_id = $1 order by created_at desc`,
    [conversationId],
  );
}

export async function getOffer(
  id: string,
): Promise<(Offer & { listing_id: string; conversation_id: string }) | null> {
  const UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID.test(id)) return null;
  const rows = await query<
    Offer & { listing_id: string; conversation_id: string }
  >(
    `select id, offered_by, price_cop, status, expires_at, created_at,
            listing_id, conversation_id
       from offers where id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

/** Marca vencidas las ofertas cuyo plazo pasó, antes de mostrarlas. */
export async function expireStaleOffers(conversationId: string): Promise<void> {
  await query(
    `update offers set status = 'vencida'
      where conversation_id = $1 and status = 'pendiente' and expires_at < now()`,
    [conversationId],
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
    [listingId],
  );
}

export { pool };

export type ConversationSummary = {
  id: string;
  listing_title: string;
  listing_status: string;
  listing_poster_path: string;
  counterpart_alias: string;
  counterpart_avatar_path: string | null;
  last_message: string | null;
  /** Si el último mensaje lo escribió quien mira, el renglón dice «Tú:». */
  last_was_mine: boolean;
  last_at: Date;
  /** Hay algo de la contraparte posterior a la última vez que esta persona leyó. */
  unread: boolean;
};

/**
 * Las conversaciones de alguien, de las dos puntas.
 *
 * Incluye las de artículos ya vendidos: la conversación es la única evidencia de lo
 * que se acordó, y hacerla desaparecer justo cuando puede hacer falta para un
 * reclamo sería lo contrario de lo que el producto promete.
 *
 * IMPORTANT: el filtro de participación va aquí, en el servidor, y todo lo que
 * muestra la bandeja —incluido el punto de no leído— sale de esta misma consulta ya
 * filtrada. Calcular el no leído aparte abriría la puerta a contar mensajes de
 * conversaciones que no son de quien pregunta.
 */
export function listConversations(
  userId: string,
): Promise<ConversationSummary[]> {
  return query<ConversationSummary>(
    `select c.id,
            l.title as listing_title,
            l.status as listing_status,
            l.poster_path as listing_poster_path,
            coalesce(u.alias, u.name) as counterpart_alias,
            u.avatar_path as counterpart_avatar_path,
            ultimo.body as last_message,
            coalesce(ultimo.sender_id = $1, false) as last_was_mine,
            coalesce(ultimo.created_at, c.created_at) as last_at,
            -- No leído es: existe algo de la OTRA persona posterior a mi última
            -- lectura. Sin fila de lectura, cualquier mensaje suyo cuenta, que es
            -- el estado correcto de una conversación que nunca se abrió.
            exists (
              select 1 from messages m
               where m.conversation_id = c.id
                 and m.sender_id <> $1
                 and m.created_at > coalesce(r.last_read_at, 'epoch'::timestamptz)
            ) as unread
       from conversations c
       join listings l on l.id = c.listing_id
       join "user" u on u.id = case when c.buyer_id = $1 then c.seller_id else c.buyer_id end
       left join conversation_reads r
              on r.conversation_id = c.id and r.user_id = $1
       left join lateral (
         select m.body, m.sender_id, m.created_at
           from messages m
          where m.conversation_id = c.id
          order by m.created_at desc
          limit 1
       ) ultimo on true
      where c.buyer_id = $1 or c.seller_id = $1
      order by last_at desc limit 30`,
    [userId],
  );
}

/**
 * Cuántas conversaciones tienen algo sin leer. Alimenta el contador de la barra
 * inferior.
 *
 * Cuenta conversaciones y no mensajes a propósito: el número que le sirve a alguien
 * es «con cuánta gente tengo algo pendiente», no cuántas frases hay sin abrir.
 */
export async function countUnreadConversations(
  userId: string,
): Promise<number> {
  const rows = await query<{ n: number }>(
    `select count(*)::int as n
       from conversations c
       left join conversation_reads r
              on r.conversation_id = c.id and r.user_id = $1
      where (c.buyer_id = $1 or c.seller_id = $1)
        and exists (
          select 1 from messages m
           where m.conversation_id = c.id
             and m.sender_id <> $1
             and m.created_at > coalesce(r.last_read_at, 'epoch'::timestamptz)
        )`,
    [userId],
  );
  return rows[0]?.n ?? 0;
}

/**
 * Marca una conversación como leída hasta ahora.
 *
 * IMPORTANT: escribe solo si quien pide es parte de la conversación. El `where`
 * del `select` es lo que lo garantiza: si no es suya, el insert no inserta ninguna
 * fila y la llamada no dice por qué. Confiar en que la pantalla ya comprobó el
 * acceso dejaría este camino abierto para siempre.
 */
export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  await query(
    `insert into conversation_reads (conversation_id, user_id, last_read_at)
     select c.id, $2, now()
       from conversations c
      where c.id = $1 and (c.buyer_id = $2 or c.seller_id = $2)
     on conflict (conversation_id, user_id)
       do update set last_read_at = now()`,
    [conversationId, userId],
  );
}

export type ChatReport = {
  id: string;
  conversation_id: string;
  reason: string;
  detail: string | null;
  created_at: Date;
  reporter_alias: string;
  reported_alias: string;
  reported_id: string;
  listing_title: string;
};

export const REPORT_REASON_LABEL: Record<string, string> = {
  insultos: "Insultos o amenazas",
  contenido_sexual: "Contenido sexual",
  estafa: "Intento de estafa",
  datos_personales: "Pide datos o pagos por fuera",
  otro: "Otra cosa",
};

/**
 * Los reportes de conversación sin resolver, para la cola de moderación (S-37).
 *
 * «Reportado» es la otra parte de la conversación, sea comprador o vendedor: el
 * acoso va en las dos direcciones y suponer que siempre lo comete quien vende
 * dejaría la mitad de los casos sin nombre.
 */
export function listOpenChatReports(): Promise<ChatReport[]> {
  return query<ChatReport>(
    `select r.id::text, r.conversation_id, r.reason, r.detail, r.created_at,
            coalesce(quien.alias, quien.name) as reporter_alias,
            coalesce(otro.alias, otro.name)   as reported_alias,
            otro.id as reported_id,
            l.title as listing_title
       from chat_reports r
       join conversations c on c.id = r.conversation_id
       join listings l      on l.id = c.listing_id
       join "user" quien    on quien.id = r.reporter_id
       join "user" otro
         on otro.id = case when c.buyer_id = r.reporter_id
                           then c.seller_id else c.buyer_id end
      where r.resolved_at is null
      order by r.created_at`,
  );
}

/** Cuántos reportes de conversación esperan, para el resumen de moderación. */
export async function countOpenChatReports(): Promise<number> {
  const rows = await query<{ n: number }>(
    `select count(*)::int as n from chat_reports where resolved_at is null`,
  );
  return rows[0]?.n ?? 0;
}

/**
 * La conversación tal cual, para moderar — y SOLO si tiene un reporte abierto.
 *
 * IMPORTANT: esta es la única puerta por la que alguien que no es parte de una
 * conversación puede leerla, y la condición va en el `where`, no en la pantalla.
 * Un administrador no puede leer conversaciones privadas porque sí: puede leer las
 * que alguien pidió que se revisaran, mientras esa revisión siga abierta.
 */
export async function getReportedConversation(id: string): Promise<{
  conversation: Conversation;
  messages: Message[];
} | null> {
  const UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID.test(id)) return null;

  const rows = await query<Conversation>(
    `select c.id, c.listing_id, c.buyer_id, c.seller_id,
            l.title as listing_title, l.price_cop as listing_price_cop,
            l.poster_path as listing_poster_path, l.status as listing_status,
            coalesce(b.alias, b.name) as buyer_alias,
            coalesce(s.alias, s.name) as seller_alias
       from conversations c
       join listings l on l.id = c.listing_id
       join "user" b   on b.id = c.buyer_id
       join "user" s   on s.id = c.seller_id
      where c.id = $1
        and exists (
          select 1 from chat_reports r
           where r.conversation_id = c.id and r.resolved_at is null
        )`,
    [id],
  );
  if (!rows[0]) return null;

  return { conversation: rows[0], messages: await listMessages(id) };
}
