"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { sendVerificationCode } from "@/lib/sms";
import { assertCanSendCode, TOO_MANY_CODES } from "@/lib/otp-rate-limit";
import {
  codeMatches,
  encryptCode,
  EXPIRY_MINUTES,
  generateCode,
  MAX_ATTEMPTS,
  normalize,
} from "./otp";

export type OtpResult = { error: string };

/**
 * Manda el código al celular del usuario de la sesión.
 *
 * El número sale de la cuenta, no del formulario: si viniera del formulario,
 * cualquiera pediría códigos a números ajenos desde una sesión propia.
 */
export async function sendCode(): Promise<OtpResult> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");
  if (!user.phoneNumber) return { error: "Tu cuenta no tiene celular todavía." };
  if (user.phoneNumberVerified) return { error: "" };

  try {
    await assertCanSendCode(user.phoneNumber);
  } catch {
    return { error: TOO_MANY_CODES };
  }

  const code = generateCode();
  await query(
    `insert into phone_codes (phone, code_enc, expires_at, attempts, used_at)
     values ($1, $2, now() + ($3 || ' minutes')::interval, 0, null)
     on conflict (phone) do update
       set code_enc = excluded.code_enc,
           expires_at = excluded.expires_at,
           attempts = 0,
           used_at = null`,
    [user.phoneNumber, encryptCode(code), String(EXPIRY_MINUTES)]
  );

  await sendVerificationCode(user.phoneNumber, code);
  return { error: "" };
}

export async function verifyCode(
  _prev: OtpResult | null,
  form: FormData
): Promise<OtpResult> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");
  if (!user.phoneNumber) return { error: "Tu cuenta no tiene celular todavía." };

  const given = normalize(String(form.get("code") ?? ""));
  if (given.length !== 6) return { error: "El código son seis dígitos." };

  const rows = await query<{
    code_enc: string;
    attempts: number;
    expired: boolean;
    used: boolean;
  }>(
    `select code_enc, attempts, (expires_at < now()) as expired,
            (used_at is not null) as used
       from phone_codes where phone = $1 for update`,
    [user.phoneNumber]
  );
  const state = rows[0];

  if (!state) return { error: "Pide un código nuevo." };
  if (state.used) return { error: "Ese código ya se usó. Pide uno nuevo." };
  if (state.expired) return { error: "El código venció. Pide uno nuevo." };
  // El límite se mira antes que el código, para que agotarlo cierre la puerta
  // incluso a quien después acierte.
  if (state.attempts >= MAX_ATTEMPTS) {
    return { error: "Demasiados intentos. Pide un código nuevo." };
  }

  if (!codeMatches(given, state.code_enc)) {
    const bumped = await query<{ attempts: number }>(
      `update phone_codes set attempts = attempts + 1 where phone = $1 returning attempts`,
      [user.phoneNumber]
    );
    const left = Math.max(0, MAX_ATTEMPTS - bumped[0].attempts);
    return {
      error: left
        ? `Ese código no es. Te ${left === 1 ? "queda 1 intento" : `quedan ${left} intentos`}.`
        : "Demasiados intentos. Pide un código nuevo.",
    };
  }

  // D-01: un celular confirma UNA cuenta. Se comprueba aquí y no al registrarse,
  // porque aquí quien pregunta ya demostró tener el número; al registrarse,
  // decirle a cualquiera "ese número ya tiene cuenta" regalaría el dato.
  const taken = await query<{ id: string }>(
    `select id from "user"
      where "phoneNumber" = $1 and "phoneNumberVerified" and id <> $2 limit 1`,
    [user.phoneNumber, user.id]
  );
  if (taken.length) {
    return {
      error:
        "Ese celular ya está confirmado en otra cuenta. Si es tuya, entra con ella o recupera la contraseña.",
    };
  }

  // El código se consume: no sirve una segunda vez.
  await query(`update phone_codes set used_at = now() where phone = $1`, [user.phoneNumber]);
  try {
    await query(`update "user" set "phoneNumberVerified" = true where id = $1`, [user.id]);
  } catch (err) {
    // Dos confirmaciones a la vez con el mismo número: el índice único de la
    // migración 0010 deja pasar una sola.
    if (err instanceof Error && /user_celular_verificado_unico/.test(err.message)) {
      return { error: "Ese celular ya está confirmado en otra cuenta." };
    }
    throw err;
  }

  revalidatePath("/");
  return { error: "" };
}
