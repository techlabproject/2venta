import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/session";
import {
  expireStaleOffers,
  getConversation,
  listMessages,
  listOffers,
} from "@/features/chat/queries";
import { REDACTION_NOTICE } from "@/features/chat/redact";
import { MessageForm, OfferDecision, OfferForm } from "@/features/chat/ChatForms";
import { AppHeader } from "@/components/AppHeader";
import { formatCop } from "@/lib/money";

// Pantalla 1h del mockup: chat interno con los pagos fuera de la app bloqueados.
export const dynamic = "force-dynamic";

export default async function Chat({ params }: { params: Promise<{ id: string }> }) {
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
  ]);

  const isBuyer = conversation.buyer_id === user.id;
  const pending = offers.find((o) => o.status === "pendiente");
  const accepted = offers.find((o) => o.status === "aceptada");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <Link href={`/producto/${conversation.listing_id}`} className="text-sm text-ink2 underline">
          {conversation.listing_title}
        </Link>
        <p className="mt-1 text-sm text-muted">
          {formatCop(conversation.listing_price_cop)}
        </p>

        <ol className="mt-6 flex flex-col gap-3">
          {messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <li
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine
                    ? "self-end rounded-br-md bg-brand text-cream"
                    : "self-start rounded-bl-md bg-white"
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
          <div className="mt-6 rounded-2xl bg-white p-4">
            <p data-testid="oferta" className="text-sm">
              Oferta de {formatCop(pending.price_cop)}
              {pending.offered_by === user.id ? " (tuya)" : ""}
            </p>
            {pending.offered_by !== user.id && <OfferDecision offerId={pending.id} />}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4">
          {!pending && !accepted && <OfferForm conversationId={conversation.id} />}
          <MessageForm conversationId={conversation.id} />
        </div>

        <p className="mt-6 text-xs text-muted">
          Cierra el trato aquí. Si pagas por fuera pierdes el pago protegido, y es
          justo lo que usan los estafadores.
        </p>
      </main>
    </>
  );
}
