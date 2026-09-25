/**
 * SMS por Inalambria Express para los códigos de verificación (D-124).
 *
 * Proveedor colombiano: se paga en pesos por paquetes de saldo, sin contrato ni
 * mensualidad, y le llega a cualquier celular (la prueba de Twilio solo a números
 * inscritos). API: https://github.com/InalambriaExpress/inalambria-express-api-docs
 *
 * `src/lib/sms.ts` decide cuándo se usa. No hay aviso de entrega: la API solo dice
 * si aceptó el mensaje, así que el envío queda anotado como «aceptado».
 *
 * IMPORTANT: el token vive en una variable de entorno (en la nube, en el secreto
 * `<entorno>/inalambria`). Nunca en el código ni en el repositorio.
 */

const API = "https://api.inalambria.express/v1";

export function inalambriaConfigurado(): boolean {
  return Boolean(process.env.INALAMBRIA_TOKEN?.trim());
}

/** Manda el SMS y devuelve el id del consumo de Inalambria. */
export async function enviarSmsPorInalambria(celular: string, texto: string): Promise<string> {
  const inicio = Date.now();
  const res = await fetch(`${API}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.INALAMBRIA_TOKEN!.trim()}`,
      "Content-Type": "application/json",
    },
    // `async: false`: la respuesta dice de una vez si lo aceptaron; con la cola de
    // ellos solo se sabría consultando el trabajo después.
    body: JSON.stringify({ content: texto, recipients: [celular], async: false }),
    // Con `async: false` responde cuando se lo entregó al operador: tarda unos 9 s
    // (medido el 2026-09-25). Con 10 s de espera, un envío un poco más lento se daba
    // por fallido y la persona recibía el código solo al pedir otro.
    signal: AbortSignal.timeout(25_000),
  });
  const datos = (await res.json().catch(() => null)) as
    | { ok?: boolean; consumptionId?: string; error?: string }
    | null;
  if (!res.ok || !datos?.ok || !datos.consumptionId) {
    // Sin el número ni el código: el registro no es lugar para datos de nadie.
    throw new Error(
      `Inalambria rechazó el SMS (${res.status}): ${
        // Su mensaje podría repetir el número: las cifras largas se tachan.
        datos?.error?.replace(/\+?\d[\d\s]{5,}/g, "…").slice(0, 120) ?? "sin detalle"
      }`,
    );
  }
  // Sin el número: solo cuánto tardó, para ver si la espera alcanza.
  console.info(`[codigo] Inalambria lo aceptó en ${Date.now() - inicio} ms`);
  return datos.consumptionId;
}
