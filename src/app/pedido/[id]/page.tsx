import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { getOrder, getOrderItems } from "@/features/payments/orders";
import { query } from "@/lib/db";
import { ConfirmReceiptButton } from "@/features/payments/ConfirmReceiptButton";
import { AppHeader } from "@/components/AppHeader";
import { ShipButton } from "@/features/shipping/ShipButton";
import { getAddress } from "@/features/shipping/queries";
import { breakdown } from "@/features/payments/money";
import { issueCode, getCodeState } from "@/features/pickup/queries";
import { RedeemForm } from "@/features/pickup/RedeemForm";
import { getClaim, KIND_LABEL } from "@/features/claims/queries";
import { OpenClaimForm, ReplyClaimForm } from "@/features/claims/Forms";
import { hasRated } from "@/features/ratings/queries";
import { RateForm } from "@/features/ratings/RateForm";
import { formatCop } from "@/lib/money";
import { paymentProvider } from "@/features/payments/provider";
import { CancelCheckoutButton } from "@/features/payments/CancelCheckoutButton";
import { CHECKOUT_TTL_MINUTES } from "@/features/payments/abandon";
import { OrderTimeline } from "@/features/payments/OrderTimeline";
import { ButtonLink } from "@/components/ui";
import { Volver } from "@/components/Volver";

// Pantalla 1j del mockup: seguimiento y liberación del pago.
export const dynamic = "force-dynamic";

// Las fechas se guardan en UTC y se formatean en Bogotá solo al mostrarlas.
const fecha = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  timeZone: "America/Bogota",
});

const LABEL: Record<string, string> = {
  pendiente_pago: "Esperando el pago",
  pagado: "Pago recibido y guardado",
  en_disputa: "Con un reclamo abierto",
  despachado: "El vendedor despachó",
  entregado: "Entregado",
  liberado: "Pago liberado al vendedor",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

export default async function Pedido({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  // Un pedido solo lo ven las dos partes. Sin esta comprobación, cualquiera con el
  // identificador vería cuánto pagó otra persona y por qué.
  if (order.buyer_id !== user.id && order.seller_id !== user.id) notFound();

  const isBuyer = order.buyer_id === user.id;
  /*
   * Quién puede ver la dirección.
   *
   * El comprador, la suya, siempre. El vendedor, solo desde que el pedido está
   * pagado, que es cuando la necesita para despachar.
   *
   * Esto estaba escrito como comentario justo encima de la sección y no estaba
   * implementado: se pintaba con que existiera una dirección. Y la dirección se
   * captura ANTES de pagar, así que el vendedor veía dónde vive alguien que llenó
   * el formulario y se arrepintió en la pasarela (ronda de verificación,
   * 2026-09-20).
   */
  const verDireccion =
    isBuyer ||
    (order.status !== "pendiente_pago" && order.status !== "cancelado");
  const items = await getOrderItems(order.id);
  // La dirección se pide a propósito y solo después de comprobar que quien mira es
  // una de las dos partes. Nunca llega arrastrada por la consulta del pedido.
  const address = await getAddress(order.id);
  const money = breakdown(order.subtotal_cop, order.shipping_cop);
  const claim = await getClaim(order.id);
  // D-17: se califica cuando el pedido terminó, no antes. Calificar durante la
  // transacción convertiría la reseña en una forma de presionar.
  const completed =
    order.status === "liberado" || order.status === "reembolsado";
  const alreadyRated = completed ? await hasRated(order.id, user.id) : true;

  // D-19: el código lo ve solo el comprador, y solo mientras haga falta. Se emite
  // la primera vez que abre el pedido pagado; después se muestra el mismo.
  const presencial = order.delivery_method === "presencial";
  const codeState = presencial ? await getCodeState(order.id) : null;
  // El comprador ve el mismo código cada vez que abre el pedido: lo necesita en el
  // encuentro, no solo el día que pagó.
  const code =
    presencial && isBuyer && order.status === "pagado" && !codeState?.used_at
      ? await issueCode(order.id)
      : null;
  const events = await query<{
    to_status: string;
    detail: string | null;
    created_at: Date;
  }>(
    `select to_status, detail, created_at from order_events
      where order_id = $1 order by created_at`,
    [order.id],
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <Volver href="/" />

        <h1 className="mt-4 font-title text-xl font-semibold">
          Pedido {order.id.slice(0, 8)}
        </h1>
        {/* La fecha de compra, como en el mockup. El estado dejó de escribirse aquí
            porque la línea de tiempo de abajo ya lo dice, y repetirlo dos veces era
            exactamente el defecto que esta rebanada vino a quitar. Sigue existiendo
            para quien usa lector de pantalla: un resumen que se anuncia de una vez
            vale más que recorrer cuatro pasos para deducir dónde va el pedido. */}
        <p className="mt-1 text-sm text-muted">
          Comprado el {fecha.format(order.created_at)}
        </p>
        <p data-testid="estado" role="status" className="sr-only">
          {LABEL[order.status]}
        </p>

        {/* D-83: el estado era un rótulo arriba y una lista de movimientos abajo.
            La misma información, repartida en dos sitios y sin decir nunca qué
            falta. */}
        <OrderTimeline
          status={order.status}
          presencial={presencial}
          events={events}
        />

        <ul className="mt-5 flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.listing_id}
              className="rounded-2xl bg-white shadow-xs p-4 ring-1 ring-line"
            >
              <p className="font-medium">{item.title_cop}</p>
              <p className="text-sm text-muted">{formatCop(item.price_cop)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">Producto</dt>
          <dd>{formatCop(order.subtotal_cop)}</dd>
          <dt className="text-muted">Envío</dt>
          <dd>{formatCop(order.shipping_cop)}</dd>
          {isBuyer && (
            <>
              <dt className="text-muted">
                {/* Un pedido cancelado nunca cobró nada: el propio aviso de
                    arriba dice «no se cobró nada». Rotular el desglose como
                    «Pagaste» lo contradecía en la misma pantalla (H-3 de Luna,
                    2026-09-20). */}
                {order.status === "pendiente_pago"
                  ? "Vas a pagar"
                  : order.status === "cancelado"
                    ? "Habrías pagado"
                    : "Pagaste"}
              </dt>
              <dd data-testid="total" className="font-medium">
                {formatCop(money.buyerTotalCop)}
              </dd>
            </>
          )}
          {!isBuyer && (
            <>
              <dt className="text-muted">Comisión 2venta</dt>
              <dd data-testid="comision">{formatCop(order.commission_cop)}</dd>
              <dt className="text-muted">Recibes</dt>
              <dd data-testid="recibe" className="font-medium">
                {formatCop(order.seller_payout_cop)}
              </dd>
            </>
          )}
        </dl>

        {/* Un pago a medias dejaba el artículo apartado sin decírselo a nadie y sin
            forma de soltarlo: ni para quien lo apartó —a quien además le decían
            «alguien más se adelantó» cuando volvía a intentarlo— ni para el
            vendedor (ronda de usuario, 2026-09-14). */}
        {isBuyer && order.status === "pendiente_pago" && (
          <section className="mt-6 rounded-2xl bg-white shadow-xs p-5 ring-1 ring-warn/40">
            <h2 className="font-title font-semibold">
              Te falta terminar el pago
            </h2>
            <p className="mt-2 text-sm text-ink2">
              Mientras tanto el artículo queda apartado para ti y nadie más
              puede comprarlo. Si no terminas en {CHECKOUT_TTL_MINUTES} minutos,
              se suelta solo y vuelve al catálogo.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {order.provider_ref && (
                <ButtonLink
                  href={paymentProvider.checkoutUrl({
                    orderId: order.id,
                    reference: order.provider_ref,
                  })}
                  className="sm:w-auto"
                >
                  Terminar el pago
                </ButtonLink>
              )}
              <div className="sm:w-auto">
                <CancelCheckoutButton orderId={order.id} />
              </div>
            </div>
          </section>
        )}

        {presencial && (
          <p className="mt-4 rounded-2xl bg-white shadow-xs p-4 text-sm ring-1 ring-line">
            Entrega en persona en {order.meeting_zone}. El punto y la hora los
            acuerdan por el chat.
          </p>
        )}

        {code && (
          <div className="mt-5 rounded-2xl bg-brand p-5 text-cream">
            <p className="text-sm">Tu código de entrega</p>
            <p
              data-testid="codigo"
              className="mt-1 font-title text-4xl tracking-[0.25em]"
            >
              {code}
            </p>
            <p className="mt-3 text-sm text-cream/85">
              Dícteselo al vendedor <strong>solo después</strong> de revisar el
              producto. En cuanto lo escriba, el pago es suyo.
            </p>
          </div>
        )}

        {presencial && !isBuyer && order.status === "pagado" && (
          <div className="mt-6 rounded-2xl bg-brand/10 p-4">
            <p className="text-sm font-medium text-brand">
              Te pagaron. Cobra en el encuentro.
            </p>
            <p className="mt-1 text-sm text-ink2">
              Cuando el comprador revise el producto te va a dictar un código de
              seis dígitos. Escríbelo aquí y el dinero pasa a tu cuenta.
            </p>
            <RedeemForm orderId={order.id} />
          </div>
        )}

        {order.tracking_number && (
          <div className="mt-5 rounded-2xl bg-white shadow-xs p-4 text-sm ring-1 ring-line">
            <p className="font-medium">Guía {order.tracking_number}</p>
            <p className="mt-1 text-muted">{order.carrier}</p>
          </div>
        )}

        {!isBuyer && !presencial && order.status === "pagado" && (
          <div className="mt-6 rounded-2xl bg-brand/10 p-4">
            <p className="text-sm font-medium text-brand">
              Te pagaron. Ya puedes despachar.
            </p>
            <p className="mt-1 text-sm text-ink2">
              Generamos la guía y te decimos a dónde llevarlo. El dinero llega a
              tu cuenta cuando el comprador confirme que recibió.
            </p>
            <ShipButton orderId={order.id} />
          </div>
        )}

        {address && verDireccion && (
          <section className="mt-6 rounded-2xl bg-white shadow-xs p-4 text-sm ring-1 ring-line">
            <h2 className="font-medium">Entrega</h2>
            <p className="mt-1 text-ink2">{address.recipient}</p>
            <p className="text-ink2">
              {address.line1}
              {address.details ? `, ${address.details}` : ""}
            </p>
            <p className="text-muted">
              {address.zone} · {address.city}
            </p>
            {address.notes && (
              <p className="mt-1 text-muted">Nota: {address.notes}</p>
            )}
          </section>
        )}

        {isBuyer &&
          (order.status === "pagado" ||
            order.status === "despachado" ||
            order.status === "entregado") && (
            <div className="mt-6 rounded-2xl bg-brand/10 p-4">
              <p className="text-sm font-medium text-brand">
                Tenemos guardados {formatCop(money.buyerTotalCop)}
              </p>
              <p className="mt-1 text-sm text-ink2">
                El dinero llega al vendedor cuando confirmes que recibiste el
                producto, o solo a los siete días de la entrega si no confirmas.
              </p>
              <ConfirmReceiptButton orderId={order.id} />
            </div>
          )}

        {/* Al vendedor se le decía a medias y solo antes de despachar: justo
            cuando el pedido lleva más tiempo en curso, la promesa desaparecía
            (hallazgo de la ronda de agentes, 2026-09-13). */}
        {!isBuyer &&
          (order.status === "pagado" ||
            order.status === "despachado" ||
            order.status === "entregado") && (
            <div className="mt-6 rounded-2xl bg-brand/10 p-4">
              <p className="text-sm font-medium text-brand">
                Te guardamos {formatCop(order.seller_payout_cop)}
              </p>
              <p className="mt-1 text-sm text-ink2">
                El dinero es tuyo cuando el comprador confirme que recibió, o
                automáticamente a los siete días de la entrega si no confirma.
              </p>
            </div>
          )}

        {!isBuyer && order.status === "liberado" && (
          <div className="mt-6 rounded-2xl bg-brand/10 p-4">
            <p className="text-sm font-medium text-brand">
              {formatCop(order.seller_payout_cop)} ya son tuyos
            </p>
            <p className="mt-1 text-sm text-ink2">
              Quedan a tu nombre en el proveedor de pagos. Retirarlos a tu
              cuenta bancaria todavía no se puede desde la app; te avisamos
              apenas esté.
            </p>
          </div>
        )}

        {claim && (
          <section className="mt-6 rounded-2xl bg-warn/10 p-4 text-sm">
            <h2 className="font-medium text-warn">
              Reclamo: {KIND_LABEL[claim.kind]}
            </h2>
            {/* D-13: mientras se decide, el dinero no se mueve. Decirlo aquí es lo
                que hace el reclamo creíble para los dos lados. */}
            {!claim.resolved_at && (
              <p className="mt-1 text-ink2">
                Estamos revisando. Tu dinero no se mueve hasta que alguien
                compare las dos versiones con el video de la publicación.
              </p>
            )}
            <p className="mt-3 font-medium">Dice quien compró</p>
            <p className="mt-0.5 text-ink2">{claim.detail}</p>

            {claim.seller_reply ? (
              <>
                <p className="mt-3 font-medium">Dice quien vendió</p>
                <p className="mt-0.5 text-ink2">{claim.seller_reply}</p>
              </>
            ) : !isBuyer && !claim.resolved_at ? (
              <ReplyClaimForm orderId={order.id} />
            ) : (
              <p className="mt-3 text-muted">
                {isBuyer ? "El vendedor todavía no ha respondido." : ""}
              </p>
            )}

            {claim.resolved_at && (
              <p data-testid="resolucion" className="mt-3 font-medium">
                Resuelto a favor{" "}
                {claim.resolution === "comprador"
                  ? "de quien compró"
                  : "de quien vendió"}
                {claim.resolution_note ? `: ${claim.resolution_note}` : "."}
              </p>
            )}
          </section>
        )}

        {/* La D-12 no cubre arrepentimiento: solo lo que no coincide o no llegó. */}
        {isBuyer &&
          !claim &&
          ["pagado", "despachado", "entregado"].includes(order.status) && (
            <OpenClaimForm orderId={order.id} />
          )}

        {completed && !alreadyRated && (
          <RateForm
            orderId={order.id}
            counterpart={isBuyer ? "quien te vendió" : "quien te compró"}
          />
        )}

        {completed && alreadyRated && (
          // Se muestra desde el servidor y no desde el formulario: al calificar, la
          // pantalla se vuelve a dibujar y el formulario desaparece, así que un
          // mensaje que viviera dentro de él no se llegaría a ver. Además sirve
          // cuando la persona vuelve al pedido días después.
          <p
            data-testid="ya-calificado"
            className="mt-6 rounded-2xl bg-brand/10 p-4 text-sm text-brand"
          >
            Ya calificaste este pedido. Gracias: es lo que le permite al
            siguiente comprador saber con quién está tratando.
          </p>
        )}
      </main>
    </>
  );
}
