import { APIError } from "better-auth/api";
import { query } from "./db";
import { ESPERA_PARA_REENVIAR_S } from "@/features/auth/vigencia";

export const MAX_SENDS_PER_HOUR = 5;

export const TOO_MANY_CODES =
  "Pediste demasiados códigos. Espera una hora y vuelve a intentar.";

// Cada mensaje enviado cuesta dinero real, así que el límite protege la factura
// tanto como la cuenta. Se cuenta por número y no por dirección IP: detrás de una
// misma IP puede haber un edificio entero de usuarios legítimos.
/** Cuántos segundos faltan para poder mandar otro código a este número (0 si ya). */
export type MotivoDeEnvio = "registro" | "recuperacion";

export async function segundosParaReenviar(
  phone: string,
  motivo: MotivoDeEnvio = "registro",
): Promise<number> {
  const rows = await query<{ faltan: number }>(
    `select greatest(0, ceil($2 - extract(epoch from now() - max(sent_at))))::int as faltan
       from otp_sends where phone = $1 and motivo = $3`,
    [phone, ESPERA_PARA_REENVIAR_S, motivo],
  );
  return rows[0]?.faltan ?? 0;
}

export class EsperaParaReenviar extends Error {
  constructor(readonly segundos: number) {
    super(`Espera ${segundos} ${segundos === 1 ? "segundo" : "segundos"} para pedir otro código.`);
  }
}

export async function assertCanSendCode(
  phone: string,
  motivo: MotivoDeEnvio = "registro",
): Promise<void> {
  // Entre un código y otro, 30 segundos: el que salió todavía puede estar llegando,
  // y sin la espera un doble toque mandaba dos.
  const faltan = await segundosParaReenviar(phone, motivo);
  if (faltan > 0) throw new EsperaParaReenviar(faltan);

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

  await query(`insert into otp_sends (phone, motivo) values ($1, $2)`, [phone, motivo]);
}
