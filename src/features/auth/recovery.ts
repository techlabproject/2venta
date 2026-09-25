"use server";

import { CODIGO_VALIDO_MINUTOS } from "./vigencia";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { sendVerificationCode } from "@/lib/sms";
import { assertCanSendCode } from "@/lib/otp-rate-limit";
import { codeMatches, encryptCode, generateCode, MAX_ATTEMPTS, normalize } from "./otp";

export type RecoveryResult = { error: string; sent?: boolean; verified?: boolean };

const EXPIRY_MINUTES = CODIGO_VALIDO_MINUTOS;

/**
 * Manda un código de recuperación al celular.
 *
 * Responde lo mismo exista o no la cuenta. Si dijera "ese celular no está
 * registrado", cualquiera podría averiguar qué números tienen cuenta en 2venta
 * probando uno por uno.
 */
export async function requestRecovery(
  _prev: RecoveryResult | null,
  form: FormData
): Promise<RecoveryResult> {
  const digits = String(form.get("phone") ?? "").replace(/\D/g, "").replace(/^57/, "");
  if (!/^3\d{9}$/.test(digits)) {
    return { error: "Escribe un celular colombiano de 10 dígitos." };
  }
  const phone = `+57${digits}`;

  const users = await query<{ id: string }>(
    `select id from "user" where "phoneNumber" = $1 and "phoneNumberVerified" = true`,
    [phone]
  );

  if (users.length > 0) {
    try {
      await assertCanSendCode(phone);
      const code = generateCode();
      await query(
        `insert into recovery_codes (phone, code_enc, expires_at, attempts, used_at)
         values ($1, $2, now() + ($3 || ' minutes')::interval, 0, null)
         on conflict (phone) do update
           set code_enc = excluded.code_enc, expires_at = excluded.expires_at,
               attempts = 0, used_at = null`,
        [phone, encryptCode(code), String(EXPIRY_MINUTES)]
      );
      await sendVerificationCode(phone, code, "recuperacion");
    } catch {
      // El límite de envíos tampoco puede revelar si la cuenta existe: se calla y
      // se responde igual.
    }
  }

  return { error: "", sent: true };
}

/** Comprueba el código y cambia la contraseña. */
export async function resetPassword(
  _prev: RecoveryResult | null,
  form: FormData
): Promise<RecoveryResult> {
  const digits = String(form.get("phone") ?? "").replace(/\D/g, "").replace(/^57/, "");
  const phone = `+57${digits}`;
  const given = normalize(String(form.get("code") ?? ""));
  const password = String(form.get("password") ?? "");

  if (password.trim().length < 8) {
    return { error: "La contraseña necesita al menos ocho caracteres que no sean espacios." };
  }

  const rows = await query<{
    code_enc: string;
    attempts: number;
    expired: boolean;
    used: boolean;
  }>(
    `select code_enc, attempts, (expires_at < now()) as expired,
            (used_at is not null) as used
       from recovery_codes where phone = $1 for update`,
    [phone]
  );
  const state = rows[0];

  if (!state) return { error: "Pide un código nuevo." };
  if (state.used) return { error: "Ese código ya se usó. Pide uno nuevo." };
  if (state.expired) return { error: "El código venció. Pide uno nuevo." };
  if (state.attempts >= MAX_ATTEMPTS) {
    return { error: "Demasiados intentos. Pide un código nuevo." };
  }

  if (!codeMatches(given, state.code_enc)) {
    const bumped = await query<{ attempts: number }>(
      `update recovery_codes set attempts = attempts + 1 where phone = $1 returning attempts`,
      [phone]
    );
    const left = Math.max(0, MAX_ATTEMPTS - bumped[0].attempts);
    return {
      error: left
        ? `Ese código no es. Te ${left === 1 ? "queda 1 intento" : `quedan ${left} intentos`}.`
        : "Demasiados intentos. Pide un código nuevo.",
    };
  }

  const users = await query<{ id: string }>(
    `select id from "user" where "phoneNumber" = $1`,
    [phone]
  );
  if (users.length === 0) return { error: "Pide un código nuevo." };
  const userId = users[0].id;

  // El hasheo lo hace la biblioteca: eso no se implementa a mano.
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  await ctx.internalAdapter.updatePassword(userId, hash);

  await query(`update recovery_codes set used_at = now() where phone = $1`, [phone]);

  // Cambiar la contraseña echa a quien estuviera dentro. No hacerlo dejaría al
  // intruso adentro mientras el dueño cree que ya lo resolvió.
  await query(`delete from session where "userId" = $1`, [userId]);

  return { error: "", verified: true };
}

/** RF-05: cerrar una sesión concreta desde la cuenta. */
export async function revokeSession(
  _prev: { error: string } | null,
  form: FormData
): Promise<{ error: string }> {
  const { currentUser } = await import("@/lib/session");
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  // El identificador del dueño va en la consulta: sin eso, cualquiera cerraría
  // sesiones ajenas con solo tener el identificador.
  await query(`delete from session where id = $1 and "userId" = $2`, [
    String(form.get("sessionId") ?? ""),
    user.id,
  ]);

  // Sin esto la fila seguía en pantalla hasta que la persona recargara: cerraba una
  // sesión, no pasaba nada visible, y se quedaba sin saber si había funcionado
  // (ronda de usuario, 2026-09-14). Que la fila desaparezca ES la confirmación.
  revalidatePath("/cuenta");
  return { error: "" };
}
