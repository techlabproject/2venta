"use server";

import { notifyUser } from "@/features/alerts/queries";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { activeUser, currentUser } from "@/lib/session";
import { conVolver } from "@/lib/destino";
import { query } from "@/lib/db";
import { getListing } from "@/features/catalog/queries";
import { redact } from "./redact";
import { claim } from "@/features/publish/claim";
import {
  ESTADOS_PARA_ESCRIBIR,
  findConversation,
  getConversation,
  getOffer,
  openConversation,
  reporteDe,
} from "./queries";
import { parseCop } from "@/features/payments/money";
import { formatCop } from "@/lib/money";
import { esEmpresa } from "@/features/sellers/queries";

export type ChatResult = { error: string };

/** Empieza (o retoma) la conversación con el vendedor de un artículo. */
export async function startConversation(
  _prev: ChatResult | null,
  form: FormData,
) {
  const listingId = String(form.get("listingId") ?? "");
  // Sin cuenta, antes se caía en «Iniciar sesión» sin decir por qué ni cómo
  // volver, y al entrar se terminaba en la portada. Ahora se explica el motivo y,
  // al entrar (o al crear la cuenta y confirmar el celular), se sigue derecho a la
  // conversación que se iba a abrir (corrección 1, 2026-09-22).
  const abrir = `/chat/abrir/${encodeURIComponent(listingId)}`;
  if (!(await currentUser())) {
    redirect(`/ingresar?motivo=chat&volver=${encodeURIComponent(abrir)}`);
  }
  const user = await activeUser();
  // D-01: sin celular confirmado no se escribe.
  if (!user.phoneNumberVerified) redirect(conVolver("/verificar", abrir));

  const listing = await getListing(listingId);
  if (!listing) return { error: "Ese artículo ya no existe." };
  if (listing.seller_id === user.id) {
    return { error: "Es tu propio artículo." };
  }

  const existente = await findConversation(listing.id, user.id);
  if (existente) redirect(`/chat/${existente}`);
  if (!ESTADOS_PARA_ESCRIBIR.includes(listing.status)) {
    return { error: "Este artículo ya no está disponible." };
  }
  // Corrección 17: el chat con un vendedor es para comprarle, y una empresa no
  // compra. La que ya existía se conserva (arriba).
  if (await esEmpresa(user.id)) redirect(`/producto/${listing.id}`);

  const id = await openConversation(listing.id, user.id, listing.seller_id);
  redirect(`/chat/${id}`);
}

/**
 * Quién puede tocar una conversación.
 *
 * `celular` distingue las dos cosas que se hacen aquí. Escribir, ofertar y
 * responder exigen celular confirmado, porque la D-01 no admite excepción y
 * porque son las acciones que llegan a la otra persona. Abrir la conversación
 * para reportarla, no: quien está recibiendo algo que no pidió es justo a quien
 * menos se le puede poner un trámite delante (D-92).
 *
 * Solo lo comprobaban las acciones que CREAN la conversación. Quien entrara con
 * Google y nunca confirmara el número podía contestar dentro de una conversación
 * que ya existía (ronda de verificación, 2026-09-20).
 */
async function assertParticipant(
  conversationId: string,
  { celular = true }: { celular?: boolean } = {},
) {
  const user = await activeUser();
  if (celular && !user.phoneNumberVerified) return "sin-celular" as const;

  const conversation = await getConversation(conversationId);
  if (!conversation) return null;
  // Una conversación privada solo la tocan sus dos partes. Sin esto, cualquiera
  // con el identificador podría leerla o escribir en ella.
  if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
    return null;
  }
  return { user, conversation };
}

const SIN_CELULAR = {
  error: "Confirma tu celular antes de escribir por el chat.",
} as const;

export async function sendMessage(_prev: ChatResult | null, form: FormData) {
  const conversationId = String(form.get("conversationId") ?? "");
  const ctx = await assertParticipant(conversationId);
  if (ctx === "sin-celular") return SIN_CELULAR;
  if (!ctx) return { error: "Esa conversación no existe o no es tuya." };

  const raw = String(form.get("body") ?? "")
    .trim()
    .slice(0, 2000);

  // Una foto adjunta (S-37, D-92). Solo el vendedor del artículo puede mandarla:
  // es el lado que tiene algo que enseñar, y es lo que se pidió.
  //
  // IMPORTANT: la clave se comprueba contra el bucket con `claim()`. El cliente
  // manda una cadena, no un archivo, y creerle sería dejar que cualquiera con
  // sesión clave en la conversación la clave de otra persona.
  const keyCruda = form.get("imageKey");
  let imagePath: string | null = null;
  if (keyCruda && String(keyCruda)) {
    if (ctx.conversation.seller_id !== ctx.user.id) {
      return { error: "Solo quien vende puede mandar fotos en el chat." };
    }
    const claimed = await claim(keyCruda, ctx.user.id, "image");
    if ("error" in claimed) return { error: claimed.error };
    imagePath = claimed.key;
  }

  // Un mensaje vacío del todo no existe; uno con foto y sin texto, sí. La base lo
  // vuelve a exigir con una restricción, porque esto es solo el primer filtro.
  if (!raw && !imagePath) return { error: "Escribe algo antes de enviar." };

  // D-22. Se guarda el texto ya filtrado, nunca el original: dejar el número
  // tachado en la base sería dejarlo disponible para quien tenga acceso a ella.
  const { text, redactions } = redact(raw);

  await query(
    `insert into messages (conversation_id, sender_id, body, redactions, image_path)
     values ($1, $2, $3, $4, $5)`,
    [conversationId, ctx.user.id, text || null, redactions, imagePath],
  );

  // Al otro se le avisa. Agrupado por minuto para que una conversación viva no
  // se convierta en una lista de veinte avisos.
  const otro =
    ctx.conversation.buyer_id === ctx.user.id
      ? ctx.conversation.seller_id
      : ctx.conversation.buyer_id;
  // Si esa persona reportó la conversación, no se le avisa (bloqueo silencioso,
  // corrección 22): el mensaje queda guardado para el equipo y nada más.
  if (!(await reporteDe(conversationId, otro))) {
    await notifyUser({
      userId: otro,
      kind: "mensaje",
      title: `Mensaje nuevo sobre ${ctx.conversation.listing_title}`,
      href: `/chat/${conversationId}`,
      subjectId: `${conversationId}:${new Date().toISOString().slice(0, 16)}`,
    });
  }

  revalidatePath(`/chat/${conversationId}`);
  return { error: "" };
}

const OFFER_HOURS = 24;

export async function makeOffer(_prev: ChatResult | null, form: FormData) {
  const conversationId = String(form.get("conversationId") ?? "");
  const ctx = await assertParticipant(conversationId);
  if (ctx === "sin-celular") return SIN_CELULAR;
  if (!ctx) return { error: "Esa conversación no existe o no es tuya." };

  // Ofertar por algo que ya se vendió o está reservado deja al vendedor aceptando
  // una oferta que el comprador no va a poder pagar: la acción de pago sí exige
  // que la publicación siga activa (ronda de verificación, 2026-09-20).
  if (ctx.conversation.listing_status !== "activa") {
    return { error: "Ese artículo ya no está disponible." };
  }

  // El vendedor sí contraoferta; lo que no hace una empresa es ofertar para comprar.
  if (ctx.conversation.buyer_id === ctx.user.id && (await esEmpresa(ctx.user.id))) {
    redirect(`/chat/${conversationId}`);
  }

  const price = parseCop(String(form.get("price") ?? ""));
  if (price === null) {
    return { error: "Escribe cuánto ofreces, en pesos y sin centavos." };
  }

  // Una oferta que no vence se queda ahí para siempre y el vendedor nunca sabe si
  // sigue en pie. Vence en un día.
  await query(
    `insert into offers (conversation_id, listing_id, offered_by, price_cop, expires_at)
     values ($1, $2, $3, $4, now() + ($5 || ' hours')::interval)`,
    [
      conversationId,
      ctx.conversation.listing_id,
      ctx.user.id,
      price,
      String(OFFER_HOURS),
    ],
  );

  const destinatario =
    ctx.conversation.buyer_id === ctx.user.id
      ? ctx.conversation.seller_id
      : ctx.conversation.buyer_id;
  if (!(await reporteDe(conversationId, destinatario))) {
    await notifyUser({
      userId: destinatario,
      kind: "oferta",
      title: `Te ofrecieron ${formatCop(price)} por ${ctx.conversation.listing_title}`,
      href: `/chat/${conversationId}`,
      subjectId: `${conversationId}:${price}`,
    });
  }

  revalidatePath(`/chat/${conversationId}`);
  // La oferta se hace desde su propio panel (D-91), así que al enviarla hay que
  // devolver a la conversación: quedarse en el panel deja a la persona mirando un
  // formulario vacío sin saber si se envió.
  redirect(`/chat/${conversationId}`);
}

export async function respondToOffer(_prev: ChatResult | null, form: FormData) {
  const user = await activeUser();
  if (!user.phoneNumberVerified) return SIN_CELULAR;

  const offer = await getOffer(String(form.get("offerId") ?? ""));
  if (!offer) return { error: "Esa oferta no existe." };

  const conversation = await getConversation(offer.conversation_id);
  if (!conversation) return { error: "Esa conversación no existe." };
  if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
    return { error: "Esa conversación no es tuya." };
  }
  // Quien hizo la oferta no la puede aceptar: eso la volvería una forma de fijar
  // el precio por su cuenta.
  if (offer.offered_by === user.id) {
    return { error: "No puedes responder tu propia oferta." };
  }
  if (offer.status !== "pendiente") {
    return { error: "Esa oferta ya no está en pie." };
  }
  if (offer.expires_at.getTime() < Date.now()) {
    await query(`update offers set status = 'vencida' where id = $1`, [
      offer.id,
    ]);
    return { error: "Esa oferta ya venció." };
  }

  const accept = String(form.get("decision") ?? "") === "aceptar";
  await query(
    `update offers set status = $2 where id = $1 and status = 'pendiente'`,
    [offer.id, accept ? "aceptada" : "rechazada"],
  );

  revalidatePath(`/chat/${offer.conversation_id}`);
  return { error: "" };
}

export async function askQuestion(_prev: ChatResult | null, form: FormData) {
  const user = await activeUser();
  if (!user.phoneNumberVerified) redirect("/verificar");

  const listingId = String(form.get("listingId") ?? "");
  const listing = await getListing(listingId);
  if (!listing) return { error: "Ese artículo ya no existe." };

  const raw = String(form.get("body") ?? "")
    .trim()
    .slice(0, 500);
  if (!raw) return { error: "Escribe tu pregunta." };

  // Las preguntas son públicas, así que el filtro importa todavía más aquí: un
  // número en una pregunta lo ve cualquiera que abra la ficha.
  const { text } = redact(raw);

  const preguntas = await query<{ id: string }>(
    `insert into questions (listing_id, asker_id, body) values ($1, $2, $3) returning id::text`,
    [listingId, user.id, text],
  );

  // Una pregunta sin responder es una venta que no avanza: el vendedor tiene que
  // enterarse sin entrar a mirar la ficha por reflejo.
  await notifyUser({
    userId: listing.seller_id,
    kind: "pregunta",
    title: `Te preguntaron algo sobre ${listing.title}`,
    href: `/producto/${listingId}`,
    subjectId: preguntas[0].id,
  });

  revalidatePath(`/producto/${listingId}`);
  return { error: "" };
}

export async function answerQuestion(_prev: ChatResult | null, form: FormData) {
  const user = await activeUser();
  if (!user.phoneNumberVerified) return SIN_CELULAR;

  const questionId = String(form.get("questionId") ?? "");
  const raw = String(form.get("answer") ?? "")
    .trim()
    .slice(0, 500);
  if (!raw) return { error: "Escribe tu respuesta." };

  const { text } = redact(raw);

  // Solo el vendedor del artículo responde, y la comprobación va dentro de la
  // consulta para que no haya ventana entre comprobar y escribir.
  const rows = await query<{ listing_id: string }>(
    `update questions q set answer = $3, answered_at = now()
       from listings l
      where q.id = $1 and l.id = q.listing_id and l.seller_id = $2
      returning q.listing_id`,
    [questionId, user.id, text],
  );
  if (rows.length === 0)
    return { error: "Esa pregunta no es de un artículo tuyo." };

  revalidatePath(`/producto/${rows[0].listing_id}`);
  return { error: "" };
}

const MOTIVOS = [
  "insultos",
  "contenido_sexual",
  "estafa",
  "datos_personales",
  "otro",
] as const;

/**
 * Reportar una conversación (S-37, D-92).
 *
 * IMPORTANT: no se le avisa a la otra parte, ni cambia nada visible para ella. Un
 * reporte que el reportado puede ver convierte el botón en algo que da miedo usar,
 * y quien está siendo acosado es justo quien menos puede permitirse ese miedo.
 */
export async function reportConversation(
  _prev: ChatResult | null,
  form: FormData,
) {
  const conversationId = String(form.get("conversationId") ?? "");
  const ctx = await assertParticipant(conversationId, { celular: false });
  if (ctx === "sin-celular") return SIN_CELULAR;
  if (!ctx) return { error: "Esa conversación no existe o no es tuya." };

  const reason = String(form.get("reason") ?? "");
  if (!(MOTIVOS as readonly string[]).includes(reason)) {
    return { error: "Escoge por qué lo estás reportando." };
  }
  const detail =
    String(form.get("detail") ?? "")
      .trim()
      .slice(0, 1000) || null;

  // Una persona reporta una conversación una vez. El índice único lo garantiza;
  // aquí solo se evita mostrarle un error a quien reporta dos veces sin querer.
  await query(
    `insert into chat_reports (conversation_id, reporter_id, reason, detail)
     values ($1, $2, $3, $4)
     on conflict (conversation_id, reporter_id) do nothing`,
    [conversationId, ctx.user.id, reason, detail],
  );

  revalidatePath(`/chat/${conversationId}`);
  return { error: "" };
}
