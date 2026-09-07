import { query } from "@/lib/db";
import { codeMatches, decryptCode, encryptCode, generateCode, MAX_ATTEMPTS, VALID_HOURS } from "./code";

export type PickupCode = {
  order_id: string;
  attempts: number;
  expires_at: Date;
  used_at: Date | null;
};

/**
 * Devuelve el código del pedido, creándolo la primera vez.
 *
 * Tiene que devolver siempre el mismo: el comprador abre la app otra vez cuando
 * llega al encuentro, y un código distinto en cada visita no le sirve a nadie.
 */
export async function issueCode(orderId: string): Promise<string | null> {
  const existing = await query<{ code_enc: string }>(
    `select code_enc from pickup_codes where order_id = $1`,
    [orderId]
  );
  if (existing[0]) return decryptCode(existing[0].code_enc);

  const code = generateCode();
  const rows = await query<{ code_enc: string }>(
    `insert into pickup_codes (order_id, code_enc, expires_at)
     values ($1, $2, now() + ($3 || ' hours')::interval)
     on conflict (order_id) do update set code_enc = pickup_codes.code_enc
     returning code_enc`,
    [orderId, encryptCode(code), String(VALID_HOURS)]
  );
  // Si otra petición se adelantó, gana la suya y se devuelve esa.
  return decryptCode(rows[0].code_enc);
}

export async function getCodeState(orderId: string): Promise<PickupCode | null> {
  const rows = await query<PickupCode>(
    `select order_id, attempts, expires_at, used_at from pickup_codes where order_id = $1`,
    [orderId]
  );
  return rows[0] ?? null;
}

export type CheckResult =
  | { ok: true }
  | {
      ok: false;
      reason: "no_existe" | "usado" | "vencido" | "bloqueado" | "incorrecto";
      /** Cuántos intentos le quedan, para poder decírselo a quien escribe. */
      remaining?: number;
    };

/**
 * Comprueba el código y lo marca usado si acierta.
 *
 * Todo ocurre con la fila bloqueada: sin eso, dos intentos simultáneos podrían
 * pasar los dos y liberar el dinero dos veces.
 */
export async function checkCode(orderId: string, given: string): Promise<CheckResult> {
  const rows = await query<{ code_enc: string; attempts: number; expired: boolean; used: boolean }>(
    `select code_enc, attempts,
            (expires_at < now()) as expired,
            (used_at is not null) as used
       from pickup_codes where order_id = $1 for update`,
    [orderId]
  );
  const state = rows[0];
  if (!state) return { ok: false, reason: "no_existe" };
  if (state.used) return { ok: false, reason: "usado" };
  if (state.expired) return { ok: false, reason: "vencido" };
  // El límite se comprueba antes de mirar el código, para que agotarlo cierre la
  // puerta incluso a quien después acierte.
  if (state.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "bloqueado" };

  if (!codeMatches(given, state.code_enc)) {
    const bumped = await query<{ attempts: number }>(
      `update pickup_codes set attempts = attempts + 1 where order_id = $1
       returning attempts`,
      [orderId]
    );
    return {
      ok: false,
      reason: "incorrecto",
      remaining: Math.max(0, MAX_ATTEMPTS - bumped[0].attempts),
    };
  }

  await query(`update pickup_codes set used_at = now() where order_id = $1`, [orderId]);
  return { ok: true };
}
