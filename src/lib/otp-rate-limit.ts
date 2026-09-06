import { APIError } from "better-auth/api";
import { query } from "./db";

export const MAX_SENDS_PER_HOUR = 5;

export const TOO_MANY_CODES =
  "Pediste demasiados códigos. Espera una hora y vuelve a intentar.";

// Cada mensaje enviado cuesta dinero real, así que el límite protege la factura
// tanto como la cuenta. Se cuenta por número y no por dirección IP: detrás de una
// misma IP puede haber un edificio entero de usuarios legítimos.
export async function assertCanSendCode(phone: string): Promise<void> {
  const rows = await query<{ n: string }>(
    `select count(*)::text as n from otp_sends
     where phone = $1 and sent_at > now() - interval '1 hour'`,
    [phone]
  );

  // Se lanza el error de la biblioteca y no uno propio: así el mensaje llega a la
  // pantalla con un código de estado correcto, en vez de convertirse en un 500
  // genérico que no le dice nada al usuario.
  if (Number(rows[0].n) >= MAX_SENDS_PER_HOUR) {
    throw new APIError("TOO_MANY_REQUESTS", { message: TOO_MANY_CODES });
  }

  await query(`insert into otp_sends (phone) values ($1)`, [phone]);
}
