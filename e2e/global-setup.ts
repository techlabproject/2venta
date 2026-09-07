import { request } from "@playwright/test";

/**
 * Compila las rutas antes de que empiecen las pruebas.
 *
 * Next en desarrollo compila cada ruta la primera vez que alguien la pide. Con las
 * pruebas en paralelo, varias caen a la vez sobre rutas sin compilar y la primera
 * de cada una paga la compilación entera dentro de su presupuesto de tiempo. El
 * síntoma es un fallo intermitente distinto en cada corrida, que no dice nada.
 *
 * Pedirlas una vez aquí saca ese costo del tiempo de las pruebas.
 */
const ROUTES = [
  "/",
  "/buscar",
  "/bienvenida",
  "/registro",
  "/ingresar",
  "/verificar",
  "/vender",
  "/publicar",
  "/admin",
  "/admin/disputas",
  "/producto/00000000-0000-4000-8000-000000000000",
  "/pedido/00000000-0000-4000-8000-000000000000",
  "/chat/00000000-0000-4000-8000-000000000000",
  "/comprar/00000000-0000-4000-8000-000000000000",
  "/vendedor/no-existe",
  "/api/auth/get-session",
];

export default async function globalSetup() {
  const baseURL = "http://localhost:3100";
  const ctx = await request.newContext({ baseURL });

  const started = Date.now();
  // Se ignoran los códigos de respuesta: un 404 o un redirección compilan la ruta
  // igual, que es lo único que se busca aquí.
  await Promise.all(ROUTES.map((route) => ctx.get(route).catch(() => {})));
  await ctx.dispose();

  console.log(`Rutas compiladas en ${Math.round((Date.now() - started) / 1000)}s`);
}
