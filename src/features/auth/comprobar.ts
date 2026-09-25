import { codeMatches } from "./otp";
import { comprobarConTwilioVerify } from "@/lib/twilio";

/**
 * ¿El código que escribió la persona es el bueno? (D-120)
 *
 * Si lo generó 2venta, se compara con el cifrado que se guardó; si lo mandó Twilio
 * Verify, lo comprueba Twilio. En los dos casos el límite de intentos y el
 * vencimiento los lleva 2venta antes de llegar aquí.
 */
export async function codigoCorrecto(
  celular: string,
  dado: string,
  guardado: { code_enc: string; verificado_por: string | null },
): Promise<boolean> {
  if (guardado.verificado_por === "twilio_verify") {
    return comprobarConTwilioVerify(celular, dado);
  }
  return codeMatches(dado, guardado.code_enc);
}
