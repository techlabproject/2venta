import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/session";
import { getOrder, getOrderItems } from "@/features/payments/orders";
import { query } from "@/lib/db";
import { ConfirmReceiptButton } from "@/features/payments/ConfirmReceiptButton";
import { AppHeader } from "@/components/AppHeader";
import { ShipButton } from "@/features/shipping/ShipButton";
import { getAddress } from "@/features/shipping/queries";
import { breakdown } from "@/features/payments/money";
import { formatCop } from "@/lib/money";

// Pantalla 1j del mockup: seguimiento y liberación del pago.
export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = {
  pendiente_pago: "Esperando el pago",
  pagado: "Pago recibido y guardado",
  despachado: "El vendedor despachó",
  entregado: "Entregado",
  liberado: "Pago liberado al vendedor",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

export default async function Pedido({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  // Un pedido solo lo ven las dos partes. Sin esta comprobación, cualquiera con el
  // identificador vería cuánto pagó otra persona y por qué.
  if (order.buyer_id !== user.id && order.seller_id !== user.id) notFound();

  const isBuyer = order.buyer_id === user.id;
  const items = await getOrderItems(order.id);
  // La dirección se pide a propósito y solo después de comprobar que quien mira es
  // una de las dos partes. Nunca llega arrastrada por la consulta del pedido.
  const address = await getAddress(order.id);
  const money = breakdown(order.subtotal_cop, order.shipping_cop);
  const events = await query<{ to_status: string; detail: string | null; created_at: Date }>(
    `select to_status, detail, created_at from order_events
      where order_id = $1 order by created_at`,
    [order.id]
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <Link href="/" className="text-sm text-ink2 underline">
          Volver
        </Link>

        <h1 className="mt-4 font-title text-xl font-semibold">
          Pedido {order.id.slice(0, 8)}
        </h1>
        <p data-testid="estado" className="mt-1 text-sm text-muted">
          {LABEL[order.status]}
        </p>

        <ul className="mt-5 flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.listing_id} className="rounded-2xl bg-white p-4">
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
              <dt className="text-muted">Pagaste</dt>
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

        {order.tracking_number && (
          <div className="mt-5 rounded-2xl bg-white p-4 text-sm">
            <p className="font-medium">Guía {order.tracking_number}</p>
            <p className="mt-1 text-muted">{order.carrier}</p>
          </div>
        )}

        {!isBuyer && order.status === "pagado" && (
          <div className="mt-6 rounded-2xl bg-brand/10 p-4">
            <p className="text-sm font-medium text-brand">Te pagaron. Ya puedes despachar.</p>
            <p className="mt-1 text-sm text-ink2">
              Generamos la guía y te decimos a dónde llevarlo. El dinero llega a tu
              cuenta cuando el comprador confirme que recibió.
            </p>
            <ShipButton orderId={order.id} />
          </div>
        )}

        {address && (
          <section className="mt-6 rounded-2xl bg-white p-4 text-sm">
            <h2 className="font-medium">Entrega</h2>
            {/* El vendedor ve la dirección solo desde que el pedido está pagado, que
                es cuando la necesita para despachar. Nunca antes. */}
            <p className="mt-1 text-ink2">{address.recipient}</p>
            <p className="text-ink2">
              {address.line1}
              {address.details ? `, ${address.details}` : ""}
            </p>
            <p className="text-muted">
              {address.zone} · {address.city}
            </p>
            {address.notes && <p className="mt-1 text-muted">Nota: {address.notes}</p>}
          </section>
        )}

        {isBuyer && (order.status === "pagado" || order.status === "despachado" || order.status === "entregado") && (
          <div className="mt-6 rounded-2xl bg-brand/10 p-4">
            <p className="text-sm font-medium text-brand">
              Tenemos guardados {formatCop(money.buyerTotalCop)}
            </p>
            <p className="mt-1 text-sm text-ink2">
              El dinero llega al vendedor cuando confirmes que recibiste el producto,
              o solo a los siete días de la entrega si no confirmas.
            </p>
            <ConfirmReceiptButton orderId={order.id} />
          </div>
        )}

        <h2 className="mt-8 font-title text-sm font-semibold">Movimientos</h2>
        <ol className="mt-3 flex flex-col gap-2 text-sm">
          {events.map((e, i) => (
            <li key={i} className="flex justify-between gap-4 border-b border-line pb-2">
              <span>{e.detail ?? LABEL[e.to_status]}</span>
              <time className="shrink-0 text-muted">
                {new Intl.DateTimeFormat("es-CO", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "America/Bogota",
                }).format(e.created_at)}
              </time>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
