import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * SMS por Twilio para los códigos de verificación (D-120).
 *
 * Solo lo que no depende de la base: armar el texto, llamar a la API, comprobar la
 * firma de los avisos de entrega y leerlos. `src/lib/sms.ts` decide cuándo se usa;
 * `src/app/api/twilio/estado` recibe los avisos.
 *
 * IMPORTANT: el Auth Token vive en una variable de entorno (en la nube, en el
 * secreto `<entorno>/twilio`). Nunca en el código ni en el repositorio.
 */

export function twilioConfigurado(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM,
  );
}

/**
 * El texto del SMS. El código va AL FINAL (D-106): la caja del código toma el último
 * bloque de seis dígitos de lo que se pega, y así ignora el «2» de «2venta» y los
 * «10 minutos».
 */
export function textoDelCodigo(codigo: string, minutos: number): string {
  return `2venta: no compartas este código con nadie. Vence en ${minutos} minutos. Tu código es ${codigo}`;
}

export class ErrorDeTwilio extends Error {
  constructor(
    message: string,
    readonly codigoTwilio?: number,
  ) {
    super(message);
  }
}

/** Envía el SMS y devuelve el id del mensaje de Twilio (`SM…`). */
export async function enviarSmsPorTwilio(
  celular: string,
  texto: string,
  avisarA?: string,
): Promise<string> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const cuerpo = new URLSearchParams({ To: celular, From: process.env.TWILIO_FROM!, Body: texto });
  if (avisarA) cuerpo.set("StatusCallback", avisarA);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: cuerpo,
    signal: AbortSignal.timeout(10_000),
  });
  const datos = (await res.json().catch(() => null)) as
    | { sid?: string; code?: number; message?: string }
    | null;
  if (!res.ok || !datos?.sid) {
    // Sin el número ni el código: el registro no es lugar para datos de nadie.
    throw new ErrorDeTwilio(
      `Twilio rechazó el SMS (${res.status}): código ${datos?.code ?? "?"}`,
      datos?.code,
    );
  }
  return datos.sid;
}

/**
 * ¿El aviso viene de Twilio? `X-Twilio-Signature` es el HMAC-SHA1, en base64, de la
 * dirección completa seguida de cada parámetro (nombre y valor) ordenados por
 * nombre, con el Auth Token. Se compara en tiempo constante.
 */
export function firmaDeTwilioValida(
  url: string,
  params: Record<string, string>,
  firma: string | null,
  token: string,
): boolean {
  if (!firma || !token) return false;
  const base = Object.keys(params)
    .sort()
    .reduce((acc, k) => acc + k + params[k], url);
  const esperada = createHmac("sha1", token).update(base, "utf8").digest();
  const recibida = Buffer.from(firma, "base64");
  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
}

/** Los estados de Twilio, llevados a los de la tabla de envíos. */
const ESTADOS: Record<string, "sent" | "delivered" | "failed" | undefined> = {
  sent: "sent",
  delivered: "delivered",
  undelivered: "failed",
  failed: "failed",
};

export function leerEstadoDeTwilio(
  params: Record<string, string>,
): { sid: string; estado: "sent" | "delivered" | "failed"; error: string | null } | null {
  const sid = params.MessageSid;
  const estado = ESTADOS[params.MessageStatus ?? ""];
  if (!sid || !estado) return null;
  return { sid, estado, error: params.ErrorCode ? `Twilio ${params.ErrorCode}` : null };
}

/**
 * Twilio Verify (D-120): Twilio genera el código, lo manda con su plantilla ya
 * aprobada («Tu código de verificación de 2venta es: 482913», con el código al
 * final) y después lo comprueba. Es lo que sí permite la cuenta de prueba, que
 * rechaza el texto propio (error 572006). El código nunca pasa por la base de
 * 2venta.
 */
export function twilioVerifyConfigurado(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID,
  );
}

async function llamarVerify(ruta: string, cuerpo: Record<string, string>) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/${ruta}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(cuerpo),
      signal: AbortSignal.timeout(10_000),
    },
  );
  const datos = (await res.json().catch(() => null)) as
    | { sid?: string; status?: string; code?: number }
    | null;
  return { res, datos };
}

/** Pide a Twilio que mande un código. Devuelve el id de la verificación (`VE…`). */
export async function enviarConTwilioVerify(celular: string): Promise<string> {
  const { res, datos } = await llamarVerify("Verifications", {
    To: celular,
    Channel: "sms",
    Locale: "es",
  });
  if (!res.ok || !datos?.sid) {
    throw new ErrorDeTwilio(
      `Twilio Verify rechazó el envío (${res.status}): código ${datos?.code ?? "?"}`,
      datos?.code,
    );
  }
  return datos.sid;
}

/**
 * ¿El código es el que mandó Twilio? Un código vencido, ya usado o que no existe
 * (Twilio responde 404) cuenta como incorrecto; un error de Twilio, no: se lanza,
 * para no decirle a nadie «ese código no es» cuando el problema es otro.
 */
export async function comprobarConTwilioVerify(celular: string, codigo: string): Promise<boolean> {
  const { res, datos } = await llamarVerify("VerificationCheck", { To: celular, Code: codigo });
  if (res.status === 404) return false;
  if (!res.ok) {
    throw new ErrorDeTwilio(
      `Twilio Verify no pudo comprobar (${res.status}): código ${datos?.code ?? "?"}`,
      datos?.code,
    );
  }
  return datos?.status === "approved";
}
