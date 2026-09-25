import { NextResponse } from "next/server";
import { actualizarEnvio } from "@/lib/envios";
import { firmaDeTwilioValida, leerEstadoDeTwilio } from "@/lib/twilio";

/**
 * Avisos de entrega de los SMS de Twilio (D-120): si cada código llegó o falló.
 *
 * Twilio firma cada aviso (`X-Twilio-Signature`) con el Auth Token, sobre la
 * dirección a la que se lo mandamos más los parámetros. Esa dirección es la que
 * `src/lib/sms.ts` le pasa como `StatusCallback`: se reconstruye igual, con
 * `BETTER_AUTH_URL`, porque detrás de CloudFront y el balanceador la dirección que
 * ve el servidor no es la pública.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const params = Object.fromEntries(
    new URLSearchParams(await request.text()).entries(),
  ) as Record<string, string>;
  const url = `${process.env.BETTER_AUTH_URL ?? ""}/api/twilio/estado`;
  if (
    !firmaDeTwilioValida(
      url,
      params,
      request.headers.get("x-twilio-signature"),
      process.env.TWILIO_AUTH_TOKEN ?? "",
    )
  ) {
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  // Los estados intermedios («queued», «sending») no se anotan; un id que no es
  // nuestro no actualiza nada. Siempre 200: si no, Twilio reintenta.
  const e = leerEstadoDeTwilio(params);
  if (e) await actualizarEnvio(e.sid, e.estado, e.error);
  return NextResponse.json({ ok: true });
}
