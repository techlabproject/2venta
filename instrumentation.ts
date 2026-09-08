/**
 * Se ejecuta una vez al arrancar el servidor.
 *
 * Comprobar la configuración aquí es lo que convierte "los pagos no se confirman y
 * nadie sabe por qué" en "falta PAYMENTS_WEBHOOK_SECRET".
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertConfig } = await import("./src/lib/config");
  assertConfig();
}
