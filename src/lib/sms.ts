import { isProduction } from "./env";

// Punto único de salida de los códigos de verificación.
//
// En desarrollo el código se escribe en el registro del servidor, porque no hay
// proveedor de SMS conectado todavía. Conectar uno real es cambiar esta función y
// nada más: ningún otro archivo sabe cómo se envía.
//
// En producción, un código impreso en el registro es una filtración: cualquiera
// con acceso a los registros puede tomar el control de una cuenta. Por eso la
// función se niega a operar si no hay proveedor configurado.
// IMPORTANT: al conectar el proveedor, el código va AL FINAL del mensaje
// («Tu código de 2venta es 482913»). La caja del código toma el último bloque de
// seis dígitos de lo que se pega, para ignorar fechas y el «2» de «2venta»
// (corrección 8, D-106); con el código al principio y una fecha después, tomaría
// la fecha.
export async function sendVerificationCode(phone: string, code: string): Promise<void> {
  if (isProduction()) {
    throw new Error(
      "No hay proveedor de SMS configurado. Conectarlo antes de desplegar a producción."
    );
  }
  console.info(`[sms] código para ${phone}: ${code}`);
}
