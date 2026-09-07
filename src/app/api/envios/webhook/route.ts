import { NextResponse } from "next/server";
import { shippingProvider } from "@/features/shipping/provider";
import { query } from "@/lib/db";
import { transition } from "@/features/payments/orders";

// Avisos de la transportadora. El de entrega es el que escribe la fecha de la que
// depende la liberación automática (D-11b), así que es el más importante del
// sistema después de los de pago.
export async function POST(request: Request) {
  const raw = await request.text();

  if (!shippingProvider.verifySignature(raw, request.headers.get("x-envios-signature"))) {
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  let body: { eventId?: unknown; trackingNumber?: unknown; type?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "cuerpo inválido" }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" ? body.eventId : null;
  const tracking = typeof body.trackingNumber === "string" ? body.trackingNumber : null;
  const type = typeof body.type === "string" ? body.type : null;

  if (!eventId || !tracking || !type) {
    return NextResponse.json({ error: "campos inválidos" }, { status: 400 });
  }

  const rows = await query<{ id: string }>(
    `select id from orders where tracking_number = $1`,
    [tracking]
  );
  const order = rows[0];
  if (!order) {
    return NextResponse.json({ error: "guía desconocida" }, { status: 404 });
  }

  if (type !== "envio.entregado") {
    return NextResponse.json({ error: "tipo de evento desconocido" }, { status: 400 });
  }

  const moved = await transition({
    orderId: order.id,
    to: "entregado",
    source: "proveedor",
    providerEventId: eventId,
    detail: "La transportadora reportó la entrega",
  });

  if (moved) {
    // Esta fecha es la que la liberación automática está esperando (D-11b).
    // Se escribe solo si no existía: si la transportadora reenvía el aviso más
    // tarde, el plazo no se reinicia y el vendedor no espera de más.
    await query(
      `update orders set delivered_at = coalesce(delivered_at, now()) where id = $1`,
      [order.id]
    );
  }

  return NextResponse.json({ ok: true, aplicado: moved });
}
