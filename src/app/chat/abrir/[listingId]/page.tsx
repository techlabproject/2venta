import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { conVolver } from "@/lib/destino";
import { getListing } from "@/features/catalog/queries";
import {
  ESTADOS_PARA_ESCRIBIR,
  findConversation,
  openConversation,
} from "@/features/chat/queries";
import { noCompra } from "@/features/sellers/queries";

export const dynamic = "force-dynamic";

/**
 * Abre la conversación con el vendedor de un artículo y lleva a ella.
 *
 * Es el destino de quien tocó «Escribirle al vendedor» sin haber entrado: la
 * acción del botón no puede esperar a que la persona entre, así que la manda a
 * entrar con esta ruta como `volver` y aquí se retoma (corrección 1, 2026-09-22).
 * Hace las mismas comprobaciones que `startConversation`.
 *
 * Crea una fila con un GET, y eso tiene un costo: un enlace desde otro sitio
 * podría abrirle a alguien una conversación vacía que no pidió. Por eso una
 * llegada desde otro sitio no abre nada y deja a la persona en la ficha, donde el
 * botón hace lo mismo con un POST (D-99).
 */
export default async function AbrirConversacion({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  const aqui = `/chat/abrir/${encodeURIComponent(listingId)}`;
  const ficha = `/producto/${encodeURIComponent(listingId)}`;

  const user = await currentUser();
  if (!user) redirect(`/ingresar?motivo=chat&volver=${encodeURIComponent(aqui)}`);
  if (user.suspendedAt) redirect("/suspendida");
  // D-01: sin celular confirmado no se escribe.
  if (!user.phoneNumberVerified) redirect(conVolver("/verificar", aqui));

  if ((await headers()).get("sec-fetch-site") === "cross-site") redirect(ficha);

  const listing = await getListing(listingId);
  if (!listing) redirect("/");
  if (listing.seller_id === user.id) redirect(ficha);

  const existente = await findConversation(listing.id, user.id);
  if (existente) redirect(`/chat/${existente}`);
  if (!ESTADOS_PARA_ESCRIBIR.includes(listing.status)) redirect(ficha);
  // Corrección 17: una empresa no abre chats de compra; la ficha le dice por qué.
  if (await noCompra(user)) redirect(ficha);

  const id = await openConversation(listing.id, user.id, listing.seller_id);
  redirect(`/chat/${id}`);
}
