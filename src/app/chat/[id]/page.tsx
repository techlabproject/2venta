import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/session";
import {
  expireStaleOffers,
  getConversation,
  listMessages,
  listOffers,
  markConversationRead,
} from "@/features/chat/queries";
import {
  MessageForm,
  OfferDecision,
  ReportChatForm,
} from "@/features/chat/ChatForms";
import { Burbujas } from "@/features/chat/Burbujas";
import { AppHeader } from "@/components/AppHeader";
import { formatCop } from "@/lib/money";
import { mediaUrl } from "@/lib/media";

// Pantalla 1h del mockup: chat interno con los pagos fuera de la app bloqueados.
export const dynamic = "force-dynamic";

export default async function Chat({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const { id } = await params;
  const conversation = await getConversation(id);
  if (!conversation) notFound();

  // Una conversación privada solo la leen sus dos partes.
  if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
    notFound();
  }

  await expireStaleOffers(conversation.id);
  const [messages, offers] = await Promise.all([
    listMessages(conversation.id),
    listOffers(conversation.id),
    // Abrir la conversación es leerla (S-35). Va después de la comprobación de
    // acceso de arriba, pero la propia consulta vuelve a filtrar por participación:
    // el control de acceso no se delega a quien llama.
    markConversationRead(conversation.id, user.id),
  ]);

  const isBuyer = conversation.buyer_id === user.id;
  const pending = offers.find((o) => o.status === "pendiente");
  const accepted = offers.find((o) => o.status === "aceptada");

  return (
    <>
      <AppHeader />
      {/* Altura completa y tres franjas: el artículo arriba, la conversación en el
          medio con su propio desplazamiento, y el compositor abajo. Es la forma de
          cualquier chat, y es lo que hacía falta para que el campo de escribir
          dejara de flotar a media pantalla (D-91).

          La barra inferior no se dibuja aquí (lo decide `BottomNav` por la ruta),
          así que el fondo de la pantalla queda libre para el compositor. */}
      <main className="mx-auto flex h-[calc(100dvh-4rem)] max-w-md flex-col px-5">
        <Link
          href={`/producto/${conversation.listing_id}`}
          className="mt-4 flex shrink-0 items-center gap-3 rounded-2xl bg-white p-3 shadow-xs ring-1 ring-line transition duration-200 ease-salida hover:ring-brand/30"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl(conversation.listing_poster_path)}
            alt=""
            aria-hidden
            className="h-12 w-12 shrink-0 rounded-xl bg-ph object-cover"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {conversation.listing_title}
            </span>
            <span className="block text-xs text-muted">
              {formatCop(conversation.listing_price_cop)} · Hablas con{" "}
              {isBuyer ? conversation.seller_alias : conversation.buyer_alias}
            </span>
          </span>
        </Link>

        {/* La conversación. `overflow-y-auto` con `flex-1` es lo que hace que el
            compositor se quede abajo por larga que sea. */}
        <div className="-mx-5 flex-1 overflow-y-auto px-5 py-4">
          <Burbujas
            messages={messages}
            offers={offers}
            userId={user.id}
            vacio={
              <p className="rounded-2xl bg-white p-4 text-sm text-ink2 shadow-xs ring-1 ring-line">
                Todavía no se han escrito. Pregúntale lo que necesites saber
                antes de comprar: en qué estado está, por qué lo vende, si tiene
                la caja.
              </p>
            }
          />
        </div>

        {/* Lo que hay que decidir ahora va justo encima del compositor, que es
            donde está mirando quien acaba de leer el último mensaje. */}
        {accepted && isBuyer && (
          <div className="shrink-0 rounded-2xl bg-brand/10 p-3">
            <p className="text-sm font-medium text-brand">
              Te aceptaron la oferta de {formatCop(accepted.price_cop)}
            </p>
            <Link
              href={`/comprar/${conversation.listing_id}?oferta=${accepted.id}`}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-accent-edge/70 bg-accent px-4 py-3 text-sm font-medium text-on-accent shadow-sm transition duration-200 ease-salida hover:brightness-[0.97] active:scale-[0.98]"
            >
              Pagar {formatCop(accepted.price_cop)}
            </Link>
          </div>
        )}

        {pending && pending.offered_by !== user.id && (
          <div className="shrink-0 rounded-2xl bg-white p-3 shadow-xs ring-1 ring-line">
            <p className="text-sm">
              Te ofrecieron {formatCop(pending.price_cop)}
            </p>
            <OfferDecision offerId={pending.id} />
          </div>
        )}

        <div className="shrink-0 border-t border-line bg-cream pt-3 pb-4">
          <MessageForm
            conversationId={conversation.id}
            puedeAdjuntar={conversation.seller_id === user.id}
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            {/* Ofertar es excepcional, así que es un enlace y no un campo
                permanente: antes competía con «Enviar» por el mismo sitio. */}
            {!pending && !accepted ? (
              <Link
                href={`/chat/${conversation.id}/oferta`}
                className="text-xs text-ink2 underline transition hover:text-brand"
              >
                Hacer una oferta
              </Link>
            ) : (
              <span />
            )}
            {/* Reportar tiene que estar siempre a mano y no tiene que gritar
                (D-92): va en el mismo renglón que ofertar, en texto pequeño. */}
            <ReportChatForm conversationId={conversation.id} />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Cierra el trato aquí: si pagas por fuera pierdes el pago protegido.
          </p>
        </div>
      </main>
    </>
  );
}
