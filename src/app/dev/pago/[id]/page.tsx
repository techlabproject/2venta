import { notFound } from "next/navigation";
import { getOrder } from "@/features/payments/orders";
import { DevPagoControls } from "@/features/payments/DevPagoControls";
import { formatCop } from "@/lib/money";

// Pantalla del proveedor de pagos de prueba. Ocupa el lugar donde el proveedor
// real mostraría su propio formulario de tarjeta o PSE. No existe en producción.
export const dynamic = "force-dynamic";

export default async function DevPago({ params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <p className="rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">
        Proveedor de pagos de prueba. Ocupa el lugar del real mientras R-02 no tenga
        respuesta. No existe en producción.
      </p>

      <h1 className="mt-6 font-title text-2xl font-semibold">Confirmar pago</h1>
      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted">Total a pagar</dt>
        <dd className="font-medium">{formatCop(order.subtotal_cop)}</dd>
        <dt className="text-muted">Comisión 2venta</dt>
        <dd>{formatCop(order.commission_cop)}</dd>
        <dt className="text-muted">Recibe el vendedor</dt>
        <dd>{formatCop(order.seller_payout_cop)}</dd>
      </dl>

      <DevPagoControls reference={order.provider_ref ?? ""} orderId={order.id} />
    </main>
  );
}
