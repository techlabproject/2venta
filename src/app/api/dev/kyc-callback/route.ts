import { NextResponse } from "next/server";
import { isProduction } from "@/lib/env";
import { signPayload } from "@/features/kyc/provider";

// Puente de desarrollo: firma el cuerpo como lo haría el proveedor y lo manda al
// webhook real. Así el camino que se prueba es el de producción, firma incluida.
export async function POST(request: Request) {
  if (isProduction()) {
    return NextResponse.json({ error: "no disponible" }, { status: 404 });
  }

  const raw = await request.text();
  const res = await fetch(new URL("/api/kyc/webhook", request.url), {
    method: "POST",
    headers: { "content-type": "application/json", "x-kyc-signature": signPayload(raw) },
    body: raw,
  });

  return NextResponse.json(await res.json(), { status: res.status });
}
