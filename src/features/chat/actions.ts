"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { getListing } from "@/features/catalog/queries";
import { redact } from "./redact";
import { getConversation, getOffer, openConversation } from "./queries";
import { parseCop } from "@/features/payments/money";

export type ChatResult = { error: string };

/** Empieza (o retoma) la conversación con el vendedor de un artículo. */
export async function startConversation(_prev: ChatResult | null, form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/ingresar");
  // D-01: sin celular confirmado no se escribe.
  if (!user.phoneNumberVerified) redirect("/verificar");

  const listing = await getListing(String(form.get("listingId") ?? ""));
  if (!listing) return { error: "Ese artículo ya no existe." };
  if (listing.seller_id === user.id) {
    return { error: "Es tu propio artículo." };
  }

  const id = await openConversation(listing.id, user.id, listing.seller_id);
  redirect(`/chat/${id}`);
}

async function assertParticipant(conversationId: string) {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const conversation = await getConversation(conversationId);
  if (!conversation) return null;
  // Una conversación privada solo la tocan sus dos partes. Sin esto, cualquiera
  // con el identificador podría leerla o escribir en ella.
  if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
    return null;
  }
  return { user, conversation };
}

export async function sendMessage(_prev: ChatResult | null, form: FormData) {
  const conversationId = String(form.get("conversationId") ?? "");
  const ctx = await assertParticipant(conversationId);
  if (!ctx) return { error: "Esa conversación no existe o no es tuya." };

  const raw = String(form.get("body") ?? "").trim().slice(0, 2000);
  if (!raw) return { error: "Escribe algo antes de enviar." };

  // D-22. Se guarda el texto ya filtrado, nunca el original: dejar el número
  // tachado en la base sería dejarlo disponible para quien tenga acceso a ella.
  const { text, redactions } = redact(raw);

  await query(
    `insert into messages (conversation_id, sender_id, body, redactions)
     values ($1, $2, $3, $4)`,
    [conversationId, ctx.user.id, text, redactions]
  );

  revalidatePath(`/chat/${conversationId}`);
  return { error: "" };
}

const OFFER_HOURS = 24;

export async function makeOffer(_prev: ChatResult | null, form: FormData) {
  const conversationId = String(form.get("conversationId") ?? "");
  const ctx = await assertParticipant(conversationId);
  if (!ctx) return { error: "Esa conversación no existe o no es tuya." };

  const price = parseCop(String(form.get("price") ?? ""));
  if (price === null) {
    return { error: "Escribe cuánto ofreces, en pesos y sin centavos." };
  }

  // Una oferta que no vence se queda ahí para siempre y el vendedor nunca sabe si
  // sigue en pie. Vence en un día.
  await query(
    `insert into offers (conversation_id, listing_id, offered_by, price_cop, expires_at)
     values ($1, $2, $3, $4, now() + ($5 || ' hours')::interval)`,
    [conversationId, ctx.conversation.listing_id, ctx.user.id, price, String(OFFER_HOURS)]
  );

  revalidatePath(`/chat/${conversationId}`);
  return { error: "" };
}

export async function respondToOffer(_prev: ChatResult | null, form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

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
    await query(`update offers set status = 'vencida' where id = $1`, [offer.id]);
    return { error: "Esa oferta ya venció." };
  }

  const accept = String(form.get("decision") ?? "") === "aceptar";
  await query(`update offers set status = $2 where id = $1 and status = 'pendiente'`, [
    offer.id,
    accept ? "aceptada" : "rechazada",
  ]);

  revalidatePath(`/chat/${offer.conversation_id}`);
  return { error: "" };
}

export async function askQuestion(_prev: ChatResult | null, form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/ingresar");
  if (!user.phoneNumberVerified) redirect("/verificar");

  const listingId = String(form.get("listingId") ?? "");
  const listing = await getListing(listingId);
  if (!listing) return { error: "Ese artículo ya no existe." };

  const raw = String(form.get("body") ?? "").trim().slice(0, 500);
  if (!raw) return { error: "Escribe tu pregunta." };

  // Las preguntas son públicas, así que el filtro importa todavía más aquí: un
  // número en una pregunta lo ve cualquiera que abra la ficha.
  const { text } = redact(raw);

  await query(`insert into questions (listing_id, asker_id, body) values ($1, $2, $3)`, [
    listingId,
    user.id,
    text,
  ]);

  revalidatePath(`/producto/${listingId}`);
  return { error: "" };
}

export async function answerQuestion(_prev: ChatResult | null, form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const questionId = String(form.get("questionId") ?? "");
  const raw = String(form.get("answer") ?? "").trim().slice(0, 500);
  if (!raw) return { error: "Escribe tu respuesta." };

  const { text } = redact(raw);

  // Solo el vendedor del artículo responde, y la comprobación va dentro de la
  // consulta para que no haya ventana entre comprobar y escribir.
  const rows = await query<{ listing_id: string }>(
    `update questions q set answer = $3, answered_at = now()
       from listings l
      where q.id = $1 and l.id = q.listing_id and l.seller_id = $2
      returning q.listing_id`,
    [questionId, user.id, text]
  );
  if (rows.length === 0) return { error: "Esa pregunta no es de un artículo tuyo." };

  revalidatePath(`/producto/${rows[0].listing_id}`);
  return { error: "" };
}
