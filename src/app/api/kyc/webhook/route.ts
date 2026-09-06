import { NextResponse } from "next/server";
import { kycProvider } from "@/features/kyc/provider";
import { applyProviderResult, type KycStatus } from "@/features/kyc/queries";

const VALID: KycStatus[] = ["pendiente", "aprobado", "rechazado"];

export async function POST(request: Request) {
  // El cuerpo se lee crudo antes de interpretarlo: la firma se calcula sobre los
  // bytes exactos que mandó el proveedor, no sobre el resultado de volver a
  // serializar el objeto.
  const raw = await request.text();

  if (!kycProvider.verifySignature(raw, request.headers.get("x-kyc-signature"))) {
    // Un webhook sin verificación de firma es un endpoint que cualquiera usa para
    // marcarse como verificado.
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  let body: { reference?: unknown; status?: unknown; reason?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "cuerpo inválido" }, { status: 400 });
  }

  const reference = typeof body.reference === "string" ? body.reference : null;
  const status = VALID.find((s) => s === body.status);
  const reason = typeof body.reason === "string" ? body.reason : null;

  if (!reference || !status) {
    return NextResponse.json({ error: "campos inválidos" }, { status: 400 });
  }

  // Escribir el estado final es idempotente por naturaleza: el mismo aviso
  // repetido deja la fila igual. Una referencia desconocida no crea nada.
  const changed = await applyProviderResult(reference, status, reason);
  if (changed === 0) {
    return NextResponse.json({ error: "referencia desconocida" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
