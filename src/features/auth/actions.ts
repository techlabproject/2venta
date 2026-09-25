"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { usuarioSinConfirmar } from "@/lib/session";
import { CELULAR_GUARDADO, normalizarCelular } from "@/lib/celular";
import { query } from "@/lib/db";
import { sendVerificationCode } from "@/lib/sms";
import { codigoCorrecto } from "./comprobar";
import { assertCanSendCode, EsperaParaReenviar, TOO_MANY_CODES } from "@/lib/otp-rate-limit";
import {
  encryptCode,
  EXPIRY_MINUTES,
  generateCode,
  MAX_ATTEMPTS,
  normalize,
} from "./otp";

export type OtpResult = {
  error: string;
  /** Segundos que faltan para poder pedir otro código (D-123, 30 s entre envíos). */
  espera?: number;
  /** El «cambio» de número fue al mismo: se reenvió el código. */
  mismoNumero?: boolean;
};

/**
 * Manda el código al celular del usuario de la sesión.
 *
 * El número sale de la cuenta, no del formulario: si viniera del formulario,
 * cualquiera pediría códigos a números ajenos desde una sesión propia.
 */
export async function sendCode(): Promise<OtpResult> {
  // D-123: todavía sin confirmar; es justo lo que se está terminando.
  const user = await usuarioSinConfirmar();
  if (!user) redirect("/ingresar");
  if (!user.phoneNumber) return { error: "Tu cuenta no tiene celular todavía." };
  if (user.phoneNumberVerified) return { error: "" };

  try {
    await assertCanSendCode(user.phoneNumber);
  } catch (err) {
    if (err instanceof EsperaParaReenviar) return { error: err.message, espera: err.segundos };
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

  try {
    const quien = await sendVerificationCode(user.phoneNumber, code);
    // D-120: si el código lo mandó Twilio Verify, se comprueba con Twilio.
    await query(`update phone_codes set verificado_por = $2 where phone = $1`, [
      user.phoneNumber,
      quien === "twilio_verify" ? "twilio_verify" : null,
    ]);
  } catch (err) {
    // Sin el número ni el código en el registro (D-117).
    console.error(`[codigo] no se pudo enviar: ${err instanceof Error ? err.message : err}`);
    return {
      error:
        "¡Uy! No pudimos mandarte el código. Revisa que el número esté bien escrito y vuelve a intentarlo en un momento.",
    };
  }
  return { error: "" };
}

export async function verifyCode(
  _prev: OtpResult | null,
  form: FormData
): Promise<OtpResult> {
  // D-123: todavía sin confirmar; es justo lo que se está terminando.
  const user = await usuarioSinConfirmar();
  if (!user) redirect("/ingresar");
  if (!user.phoneNumber) return { error: "Tu cuenta no tiene celular todavía." };

  const given = normalize(String(form.get("code") ?? ""));
  if (given.length !== 6) return { error: "El código son seis dígitos." };

  const rows = await query<{
    code_enc: string;
    attempts: number;
    expired: boolean;
    used: boolean;
    verificado_por: string | null;
  }>(
    `select code_enc, attempts, (expires_at < now()) as expired,
            (used_at is not null) as used, verificado_por
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

  let acierta: boolean;
  try {
    acierta = await codigoCorrecto(user.phoneNumber, given, state);
  } catch (err) {
    console.error(`[codigo] no se pudo comprobar: ${err instanceof Error ? err.message : err}`);
    return { error: "¡Uy! No pudimos comprobar el código. Intenta de nuevo en un momento." };
  }
  if (!acierta) {
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

/** Tope de cambios de número antes de confirmar (D-123). */
const MAX_CAMBIOS_DE_CELULAR = 3;

/**
 * «¿No es tu número?» (D-123): corrige el celular de un registro sin confirmar y
 * manda el código al nuevo. Solo para la cuenta de la sesión y solo mientras no esté
 * confirmada: una cuenta confirmada no cambia de número por aquí.
 *
 * El tope evita usar el cambio para mandar códigos a una lista de números ajenos; el
 * límite por número de `sendCode` sigue valiendo para cada uno.
 */
export async function cambiarCelular(
  _prev: OtpResult | null,
  form: FormData,
): Promise<OtpResult> {
  const user = await usuarioSinConfirmar();
  if (!user) redirect("/ingresar");
  if (user.phoneNumberVerified) return { error: "Tu celular ya está confirmado." };

  const phone = normalizarCelular(String(form.get("phone") ?? ""));
  if (!phone || !CELULAR_GUARDADO.test(phone)) {
    return { error: "Escribe un celular colombiano de 10 dígitos, por ejemplo 300 412 88 05." };
  }
  if (phone === user.phoneNumber) {
    const res = await sendCode();
    return res.error ? res : { error: "", mismoNumero: true };
  }

  const usado = await query(
    `select 1 from "user" where "phoneNumber" = $1 and "phoneNumberVerified" limit 1`,
    [phone],
  );
  if (usado.length) {
    return { error: "¡Uy! Ese celular ya tiene una cuenta. Inicia sesión o recupera tu contraseña." };
  }

  const cambio = await query<{ id: string }>(
    `update "user" set "phoneNumber" = $2, cambios_de_celular = cambios_de_celular + 1
      where id = $1 and not "phoneNumberVerified" and cambios_de_celular < $3
      returning id`,
    [user.id, phone, MAX_CAMBIOS_DE_CELULAR],
  );
  if (!cambio.length) {
    return {
      error:
        "Ya cambiaste el número varias veces. Si sigue sin llegarte el código, vuelve a crear la cuenta.",
    };
  }

  const res = await sendCode();
  revalidatePath("/verificar");
  return res;
}
