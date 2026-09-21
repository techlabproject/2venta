import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { getConversation, listOffers } from "@/features/chat/queries";
import { AppHeader } from "@/components/AppHeader";
import { OfferPanelForm } from "@/features/chat/ChatForms";
import { formatCop } from "@/lib/money";
import { mediaUrl } from "@/lib/media";
import { Volver } from "@/components/Volver";

// El panel de oferta (S-36, D-91).
//
// Antes esto era un segundo campo de texto permanente debajo del de escribir, con
// el mismo peso que «Enviar». La acción de cada día —preguntar— y la excepcional
// —negociar— competían por el mismo sitio, y el ojo encontraba el campo de precio
// antes que el de escribir.
//
// Es una pantalla propia y no un diálogo a propósito: una oferta es un compromiso
// con vencimiento, merece una decisión consciente, y así funciona sin JavaScript.
export const dynamic = "force-dynamic";

export default async function Oferta({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const { id } = await params;
  const conversation = await getConversation(id);
  if (!conversation) notFound();

  // Una conversación privada solo la usan sus dos partes. Mismo control que en el
  // chat: la pantalla de oferta no es una puerta trasera a la conversación.
  if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
    notFound();
  }

  // Con una oferta viva no se hace otra: dos ofertas abiertas a la vez dejan al
  // otro sin saber cuál está aceptando.
  const offers = await listOffers(conversation.id);
  const viva = offers.find(
    (o) => o.status === "pendiente" || o.status === "aceptada",
  );
  if (viva) redirect(`/chat/${conversation.id}`);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <Volver href={`/chat/${conversation.id}`}>Volver a la conversación</Volver>

        <h1 className="mt-4 font-title text-2xl font-semibold">
          Haz una oferta
        </h1>

        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-xs ring-1 ring-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl(conversation.listing_poster_path)}
            alt=""
            aria-hidden
            className="h-14 w-14 shrink-0 rounded-xl bg-ph object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {conversation.listing_title}
            </p>
            <p className="text-xs text-muted">
              Pide {formatCop(conversation.listing_price_cop)}
            </p>
          </div>
        </div>

        <OfferPanelForm
          conversationId={conversation.id}
          askingPrice={conversation.listing_price_cop}
        />

        <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-ink2 shadow-xs ring-1 ring-line">
          <p className="font-medium text-ink">Qué pasa si la acepta</p>
          <p className="mt-1">
            Vas a pagar ese precio con pago protegido, igual que una compra
            normal: tu plata queda guardada hasta que confirmes que recibiste.
          </p>
          <p className="mt-2">
            La oferta vence en 24 horas. Si no responde, se cae sola y puedes
            hacer otra.
          </p>
        </div>
      </main>
    </>
  );
}
