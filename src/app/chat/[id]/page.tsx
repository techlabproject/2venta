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
import { REDACTION_NOTICE } from "@/features/chat/redact";
import {
  MessageForm,
  OfferDecision,
  OfferForm,
} from "@/features/chat/ChatForms";
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
      <main className="mx-auto max-w-md px-5 py-6">
        {/* El artículo, con su foto, encabeza la conversación: sin él el chat era
            una lista de burbujas sin contexto, y no se sabía de qué se hablaba ni
            con quién. */}
        <Link
          href={`/producto/${conversation.listing_id}`}
          className="flex items-center gap-3 rounded-2xl bg-white shadow-xs p-3 ring-1 ring-line transition hover:ring-brand/30"
        >
          <img
            src={mediaUrl(conversation.listing_poster_path)}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl bg-ph object-cover"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {conversation.listing_title}
            </span>
            <span className="block font-title text-base font-semibold tabular-nums">
              {formatCop(conversation.listing_price_cop)}
            </span>
          </span>
        </Link>

        <p className="mt-3 text-sm text-muted">
          Hablas con{" "}
          <span className="font-medium text-ink">
            {isBuyer ? conversation.seller_alias : conversation.buyer_alias}
          </span>
        </p>

        {messages.length === 0 && (
          <p className="mt-6 rounded-2xl bg-white shadow-xs p-4 text-sm text-ink2 ring-1 ring-line">
            Todavía no se han escrito. Pregúntale lo que necesites saber antes
            de comprar: en qué estado está, por qué lo vende, si tiene la caja.
          </p>
        )}

        <ol className="mt-6 flex flex-col gap-3">
          {messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <li
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine
                    ? "self-end rounded-br-md bg-brand text-cream"
                    : "self-start rounded-bl-md bg-white ring-1 ring-line"
                }`}
              >
                <p>{m.body}</p>
                {m.redactions.length > 0 && (
                  // El mockup lo dice así: se oculta y se explica por qué. Un
                  // mensaje bloqueado sin explicación se lee como una falla.
                  <p
                    data-testid="aviso-filtro"
                    className={`mt-1.5 text-xs ${mine ? "text-accent-on-brand" : "text-warn"}`}
                  >
                    {REDACTION_NOTICE}
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        {accepted && isBuyer && (
          <div className="mt-6 rounded-2xl bg-brand/10 p-4">
            <p className="text-sm font-medium text-brand">
              Te aceptaron la oferta de {formatCop(accepted.price_cop)}
            </p>
            <Link
              href={`/comprar/${conversation.listing_id}?oferta=${accepted.id}`}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-medium text-on-accent"
            >
              Pagar {formatCop(accepted.price_cop)}
            </Link>
          </div>
        )}

        {pending && (
          <div className="mt-6 rounded-2xl bg-white shadow-xs p-4 ring-1 ring-line">
            <p data-testid="oferta" className="text-sm">
              Oferta de {formatCop(pending.price_cop)}
              {pending.offered_by === user.id ? " (tuya)" : ""}
            </p>
            {pending.offered_by !== user.id && (
              <OfferDecision offerId={pending.id} />
            )}
          </div>
        )}

        {/* Escribir es la acción principal y va primero. Ofertar queda debajo y
            en secundario: antes iba encima, y el ojo encontraba el campo de
            precio antes que el de escribir. */}
        <div className="mt-6 flex flex-col gap-4">
          <MessageForm conversationId={conversation.id} />
          {!pending && !accepted && (
            <OfferForm conversationId={conversation.id} />
          )}
        </div>

        <p className="mt-6 text-xs text-muted">
          Cierra el trato aquí. Si pagas por fuera pierdes el pago protegido, y
          es justo lo que usan los estafadores.
        </p>
      </main>
    </>
  );
}
