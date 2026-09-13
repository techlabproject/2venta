import { NextResponse } from "next/server";
import { isProduction } from "@/lib/env";
import { signPayload } from "@/features/shipping/provider";

// Puente de desarrollo: firma el cuerpo como lo haría la transportadora.
export async function POST(request: Request) {
  if (isProduction()) {
    return NextResponse.json({ error: "no disponible" }, { status: 404 });
  }
  const raw = await request.text();
  const res = await fetch(new URL("/api/envios/webhook", request.url), {
    method: "POST",
    headers: { "content-type": "application/json", "x-envios-signature": signPayload(raw) },
    body: raw,
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
