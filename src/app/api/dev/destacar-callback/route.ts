import { NextResponse } from "next/server";
import { signPayload } from "@/features/payments/provider";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "no disponible" }, { status: 404 });
  }
  const raw = await request.text();
  const res = await fetch(new URL("/api/pagos/destacar", request.url), {
    method: "POST",
    headers: { "content-type": "application/json", "x-pagos-signature": signPayload(raw) },
    body: raw,
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
