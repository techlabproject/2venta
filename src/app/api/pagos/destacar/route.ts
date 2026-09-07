import { NextResponse } from "next/server";
import { paymentProvider } from "@/features/payments/provider";
import { findByProviderRef } from "@/features/promotions/queries";
import { activatePromotion, cancelPromotion } from "@/features/promotions/actions";

// Webhook del pago de un destacado. Mismas reglas que el de la compra: firma
// verificada antes de procesar, y tolerante a llegar repetido.
export async function POST(request: Request) {
  const raw = await request.text();

  if (!paymentProvider.verifySignature(raw, request.headers.get("x-pagos-signature"))) {
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  let body: { reference?: unknown; type?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "cuerpo inválido" }, { status: 400 });
  }

  const reference = typeof body.reference === "string" ? body.reference : null;
  const type = typeof body.type === "string" ? body.type : null;
  if (!reference || !type) {
    return NextResponse.json({ error: "campos inválidos" }, { status: 400 });
  }

  const promotion = await findByProviderRef(reference);
  if (!promotion) {
    return NextResponse.json({ error: "referencia desconocida" }, { status: 404 });
  }

  // Que ya esté aplicado no es un error: el proveedor reintenta por diseño.
  const applied =
    type === "pago.aprobado"
      ? await activatePromotion(promotion.id)
      : type === "pago.rechazado"
        ? await cancelPromotion(promotion.id)
        : null;

  if (applied === null) {
    return NextResponse.json({ error: "tipo de evento desconocido" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, aplicado: applied });
}
