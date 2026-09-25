import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { query } from "@/lib/db";
import { firmaValida, leerEstados } from "@/lib/whatsapp";

/**
 * Avisos de WhatsApp Cloud (D-117): si cada código se entregó, se leyó o falló.
 *
 * GET: la verificación que hace Meta al registrar la URL. Responde `hub.challenge`
 * solo si `hub.verify_token` es el nuestro (`WHATSAPP_VERIFY_TOKEN`).
 *
 * POST: los avisos, firmados con el secreto de la app (`X-Hub-Signature-256`). Meta
 * reintenta y los manda a destiempo, así que tiene que tolerar repeticiones y
 * desorden: un estado nunca retrocede («leído» no vuelve a «enviado»).
 */
export const dynamic = "force-dynamic";

function iguales(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const esperado = process.env.WHATSAPP_VERIFY_TOKEN ?? "";
  const recibido = p.get("hub.verify_token") ?? "";
  const reto = p.get("hub.challenge") ?? "";
  if (p.get("hub.mode") !== "subscribe" || !esperado || !iguales(recibido, esperado)) {
    return new Response("verificación inválida", { status: 403 });
  }
  return new Response(reto, { status: 200, headers: { "Content-Type": "text/plain" } });
}

// El orden en que avanza un mensaje. `failed` gana siempre: un mensaje que falló
// no llegó, aunque antes haya dicho «enviado».
const ORDEN: Record<string, number> = { aceptado: 0, sent: 1, delivered: 2, read: 3, failed: 4 };

export async function POST(request: Request) {
  // Crudo: la firma se calcula sobre los bytes exactos que mandó Meta.
  const crudo = await request.text();
  if (
    !firmaValida(
      crudo,
      request.headers.get("x-hub-signature-256"),
      process.env.WHATSAPP_APP_SECRET ?? "",
    )
  ) {
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  let aviso: unknown;
  try {
    aviso = JSON.parse(crudo);
  } catch {
    return NextResponse.json({ error: "cuerpo inválido" }, { status: 400 });
  }

  // Un mensaje que no es de un código enviado por 2venta (por ejemplo, alguien que
  // le escribe al número) no actualiza nada. Se responde 200 igual: si no, Meta
  // reintenta sin fin.
  for (const e of leerEstados(aviso)) {
    await query(
      `update envios_codigo
          set estado = $2, error = coalesce($3, error), updated_at = now()
        where wamid = $1
          and (case estado when 'aceptado' then 0 when 'sent' then 1 when 'delivered' then 2
                           when 'read' then 3 when 'failed' then 4 end) < $4`,
      [e.wamid, e.estado, e.error, ORDEN[e.estado]],
    );
  }

  return NextResponse.json({ ok: true });
}
