import { notFound } from "next/navigation";
import { isProduction } from "@/lib/env";
import { getOrder } from "@/features/payments/orders";
import { DevPagoControls } from "@/features/payments/DevPagoControls";
import { formatCop } from "@/lib/money";
import { breakdown } from "@/features/payments/money";

// Pantalla del proveedor de pagos de prueba. Ocupa el lugar donde el proveedor
// real mostraría su propio formulario de tarjeta o PSE. No existe en producción.
export const dynamic = "force-dynamic";

export default async function DevPago({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (isProduction()) notFound();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  // Lo que se cobra es producto MÁS envío, y es exactamente lo que se le manda al
  // proveedor. Esta pantalla mostraba solo el subtotal con el rótulo «Total a
  // pagar», así que quien revisaba las cuentas veía $35.000 donde el checkout
  // decía $47.000 y concluía, con razón, que algo estaba mal cobrado
  // (hallazgo de la ronda de usuario, 2026-09-14).
  const cuentas = breakdown(order.subtotal_cop, order.shipping_cop);

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <p className="rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">
        Proveedor de pagos de prueba. Ocupa el lugar del real mientras R-02 no
        tenga respuesta. No existe en producción.
      </p>

      <h1 className="mt-6 font-title text-2xl font-semibold">Confirmar pago</h1>
      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted">Producto</dt>
        <dd>{formatCop(order.subtotal_cop)}</dd>
        <dt className="text-muted">Envío</dt>
        <dd>{formatCop(order.shipping_cop)}</dd>
        <dt className="font-medium">Total a pagar</dt>
        <dd data-testid="total-a-pagar" className="font-medium">
          {formatCop(cuentas.buyerTotalCop)}
        </dd>
      </dl>

      {/* Lo de abajo no lo ve un comprador: es el reparto que hace el proveedor,
          y se muestra aquí porque esta pantalla también sirve para revisar que las
          cuentas cuadren. La comisión sale del producto, nunca del envío (D-09). */}
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-line pt-4 text-sm text-muted">
        <dt>Comisión 2venta</dt>
        <dd>{formatCop(order.commission_cop)}</dd>
        <dt>Recibe el vendedor</dt>
        <dd>{formatCop(order.seller_payout_cop)}</dd>
        <dt>Va a la transportadora</dt>
        <dd>{formatCop(order.shipping_cop)}</dd>
      </dl>

      <DevPagoControls
        reference={order.provider_ref ?? ""}
        orderId={order.id}
      />
    </main>
  );
}
