import { NextResponse } from "next/server";
import { paymentProvider } from "@/features/payments/provider";
import { findByProviderRef, transition } from "@/features/payments/orders";
import { query } from "@/lib/db";

// Avisos del proveedor de pagos. Los proveedores reintentan, así que esto llega
// repetido y a destiempo por diseño, no por accidente.
export async function POST(request: Request) {
  // El cuerpo se lee crudo: la firma se calcula sobre los bytes exactos que mandó
  // el proveedor, no sobre el resultado de volver a serializar el objeto.
  const raw = await request.text();

  if (!paymentProvider.verifySignature(raw, request.headers.get("x-pagos-signature"))) {
    // Un webhook de pagos sin verificación de firma es un endpoint que cualquiera
    // usa para marcar sus pedidos como pagados.
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  let body: { eventId?: unknown; reference?: unknown; type?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "cuerpo inválido" }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" ? body.eventId : null;
  const reference = typeof body.reference === "string" ? body.reference : null;
  const type = typeof body.type === "string" ? body.type : null;

  if (!eventId || !reference || !type) {
    return NextResponse.json({ error: "campos inválidos" }, { status: 400 });
  }

  const order = await findByProviderRef(reference);
  if (!order) {
    return NextResponse.json({ error: "referencia desconocida" }, { status: 404 });
  }

  if (type === "pago.aprobado") {
    const moved = await transition({
      orderId: order.id,
      to: "pagado",
      source: "proveedor",
      providerEventId: eventId,
      detail: "Pago recibido y retenido",
    });
    if (moved) {
      await query(
        `update listings set status = 'vendida'
          where id in (select listing_id from order_items where order_id = $1)`,
        [order.id]
      );
    }
    // Un aviso repetido o fuera de orden responde 200 igual: para el proveedor la
    // entrega fue exitosa y no tiene por qué reintentar.
    return NextResponse.json({ ok: true, aplicado: moved });
  }

  if (type === "pago.rechazado") {
    const moved = await transition({
      orderId: order.id,
      to: "cancelado",
      source: "proveedor",
      providerEventId: eventId,
      detail: "El pago fue rechazado",
    });
    if (moved) {
      // El artículo vuelve a estar disponible.
      await query(
        `update listings set status = 'activa'
          where id in (select listing_id from order_items where order_id = $1)`,
        [order.id]
      );
    }
    return NextResponse.json({ ok: true, aplicado: moved });
  }

  return NextResponse.json({ error: "tipo de evento desconocido" }, { status: 400 });
}
