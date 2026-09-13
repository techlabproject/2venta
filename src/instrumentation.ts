/**
 * Se ejecuta una vez al arrancar el servidor.
 *
 * Comprobar la configuración aquí es lo que convierte "los pagos no se confirman y
 * nadie sabe por qué" en "falta PAYMENTS_WEBHOOK_SECRET".
 *
 * Se sale del proceso a propósito en vez de lanzar: Next atrapa la excepción del
 * hook y deja el servidor vivo respondiendo 500. Un proceso vivo con la
 * configuración rota pasa por "arrancó" para quien lo despliega; uno que muere
 * hace que el despliegue se revierta solo, que es lo que se quiere.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertConfigOrExit } = await import("./lib/boot");
  assertConfigOrExit();
}
