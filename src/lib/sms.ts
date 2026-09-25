import { isProduction } from "./env";
import { enviarCodigoPorWhatsApp, whatsappConfigurado } from "./whatsapp";
import { enviarSmsPorInalambria, inalambriaConfigurado } from "./inalambria";
import {
  enviarConTwilioVerify,
  enviarSmsPorTwilio,
  textoDelCodigo,
  twilioConfigurado,
  twilioVerifyConfigurado,
} from "./twilio";
import { CODIGO_VALIDO_MINUTOS } from "@/features/auth/vigencia";

// Punto único de salida de los códigos de verificación. Ningún otro archivo sabe
// cómo se envían.
//
// Canales, en orden (D-117, D-124, D-120): WhatsApp; SMS por Inalambria Express
// (colombiano, en pesos); SMS por Twilio con nuestro texto; y Twilio Verify, donde el
// código lo genera y lo comprueba Twilio (es lo que permite la cuenta de prueba, que
// rechaza el texto propio con el error 572006). Se pasa al siguiente si el anterior
// no está configurado o falla.
//
// Devuelve quién tiene el código: `propio` (el que generó 2venta y guardó cifrado)
// o `twilio_verify` (hay que comprobarlo con Twilio), para que quien lo pidió sepa
// cómo verificarlo después.
//
// En producción, un código impreso en el registro es una filtración: cualquiera con
// acceso a los registros puede tomar el control de una cuenta. Ahí el código solo
// sale por un canal, y la función se niega a operar si no hay ninguno.
//
// En desarrollo (local y la nube `dev`) el código se escribe también en el registro:
// las pruebas y la prueba de humo lo leen de ahí. Si hay un canal configurado se usa
// de verdad, y si todos los que se intentaron fallan se dice, igual que en
// producción: callarlo dejaba a la persona esperando un código que nunca salió. A
// los números fuera de `CODIGOS_REALES_SOLO_A` no se les intenta nada.
//
// IMPORTANT: el código va AL FINAL del SMS (D-106): la caja del código toma el
// último bloque de seis dígitos de lo que se pega. La plantilla de WhatsApp también
// lo deja al final («Tu código de verificación es 482913»).

export type MotivoDelCodigo = "registro" | "recuperacion";

export type QuienTieneElCodigo = "propio" | "twilio_verify";

export async function sendVerificationCode(
  phone: string,
  code: string,
  motivo: MotivoDelCodigo = "registro",
): Promise<QuienTieneElCodigo> {
  if (!isProduction()) console.info(`[sms] código para ${phone}: ${code}`);

  // Con la cuenta de prueba de Twilio cada verificación cuenta, y las pruebas con
  // números inventados agotaban el límite de solicitudes (el SMS de Nicolás no salió
  // por eso, 2026-09-25). En desarrollo, con `CODIGOS_REALES_SOLO_A`, solo esos
  // números reciben el código de verdad; el resto lo tiene en el registro.
  if (!isProduction() && !saleDeVerdad(phone)) return "propio";

  const canales: (() => Promise<QuienTieneElCodigo>)[] = [];
  if (whatsappConfigurado()) {
    canales.push(async () => {
      const id = await enviarCodigoPorWhatsApp(phone, code);
      await anotar(id, phone, motivo, "whatsapp");
      return "propio";
    });
  }
  if (inalambriaConfigurado()) {
    canales.push(async () => {
      const id = await enviarSmsPorInalambria(phone, textoDelCodigo(code, CODIGO_VALIDO_MINUTOS));
      await anotar(id, phone, motivo, "sms");
      return "propio";
    });
  }
  if (twilioConfigurado()) {
    canales.push(async () => {
      const avisarA = process.env.BETTER_AUTH_URL
        ? `${process.env.BETTER_AUTH_URL}/api/twilio/estado`
        : undefined;
      const id = await enviarSmsPorTwilio(phone, textoDelCodigo(code, CODIGO_VALIDO_MINUTOS), avisarA);
      await anotar(id, phone, motivo, "sms");
      return "propio";
    });
  }
  if (twilioVerifyConfigurado()) {
    canales.push(async () => {
      const id = await enviarConTwilioVerify(phone);
      await anotar(id, phone, motivo, "sms");
      return "twilio_verify";
    });
  }

  if (canales.length === 0) {
    if (isProduction()) {
      throw new Error(
        "No hay proveedor de SMS configurado: faltan INALAMBRIA_TOKEN, TWILIO_* o WHATSAPP_* (ver infra/LEEME.md).",
      );
    }
    return "propio";
  }

  let ultimo: unknown;
  for (const canal of canales) {
    try {
      return await canal();
    } catch (err) {
      ultimo = err;
      console.error(`[codigo] un canal falló: ${err instanceof Error ? err.message : err}`);
    }
  }
  throw ultimo;
}

/**
 * Se importa aquí y no arriba: sin canal esta función no toca la base. Y no lanza:
 * el código ya salió, y si anotarlo fallara se probaría el siguiente canal y a la
 * persona le llegarían dos códigos.
 */
async function anotar(id: string, telefono: string, motivo: MotivoDelCodigo, canal: "whatsapp" | "sms") {
  try {
    const { anotarEnvio } = await import("./envios");
    await anotarEnvio({ mensajeId: id, telefono, motivo, canal });
  } catch (err) {
    console.error(`[codigo] no se pudo anotar el envío: ${err instanceof Error ? err.message : err}`);
  }
}

function saleDeVerdad(phone: string): boolean {
  const lista = process.env.CODIGOS_REALES_SOLO_A?.trim();
  if (!lista) return true;
  return lista
    .split(",")
    .map((n) => n.trim())
    .includes(phone);
}
