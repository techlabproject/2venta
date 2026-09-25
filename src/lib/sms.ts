import { isProduction } from "./env";
import { enviarCodigoPorWhatsApp, whatsappConfigurado } from "./whatsapp";

// Punto único de salida de los códigos de verificación.
//
// El canal es WhatsApp Cloud (D-117, decisión de Nicolás; reemplaza al agregador de
// SMS de la D-107). Ningún otro archivo sabe cómo se envía.
//
// En producción, un código impreso en el registro es una filtración: cualquiera
// con acceso a los registros puede tomar el control de una cuenta. Por eso ahí solo
// sale por WhatsApp, y la función se niega a operar si no está configurado.
//
// En desarrollo (local y la nube `dev`) el código se escribe también en el registro:
// las pruebas y la prueba de humo contra la nube lo leen de ahí. Si además hay
// WhatsApp configurado, se envía de verdad.
//
// IMPORTANT: el texto lo pone la plantilla aprobada en Meta, con el código AL
// PRINCIPIO («482913 es tu código…»). La caja del código toma el último bloque de
// seis dígitos de lo que se pega (D-106); el resto de la plantilla no trae otro
// bloque de seis dígitos, así que funciona igual. Si la plantilla cambia, revisarlo.

export type MotivoDelCodigo = "registro" | "recuperacion";

export async function sendVerificationCode(
  phone: string,
  code: string,
  motivo: MotivoDelCodigo = "registro",
): Promise<void> {
  if (!isProduction()) console.info(`[sms] código para ${phone}: ${code}`);

  if (!whatsappConfigurado()) {
    if (isProduction()) {
      throw new Error(
        "No hay proveedor de SMS configurado: faltan WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID.",
      );
    }
    return;
  }

  const wamid = await enviarCodigoPorWhatsApp(phone, code);
  // Se anota para que el aviso de entrega (webhook) diga si llegó. Se importa aquí
  // y no arriba: sin WhatsApp esta función no toca la base, y así se prueba sola.
  const { query } = await import("./db");
  await query(
    `insert into envios_codigo (wamid, telefono, motivo) values ($1, $2, $3)
     on conflict (wamid) do nothing`,
    [wamid, phone, motivo],
  );
}
