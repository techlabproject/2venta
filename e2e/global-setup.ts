import { request } from "@playwright/test";
import { baseURL } from "../playwright.config";

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
  "/legal",
  "/api/buscar/conteo",
  "/bienvenida",
  "/registro",
  "/ingresar",
  "/verificar",
  "/vender",
  "/publicar",
  "/tienda",
  "/avisos",
  "/favoritos",
  "/carrito",
  "/comprar/carrito",
  "/actividad",
  "/chats",
  "/cuenta",
  "/suspendida",
  "/cuenta/editar",
  "/admin/usuarios",
  "/admin/reportes",
  "/recuperar",
  "/vender/metricas",
  "/dev/destacar/00000000-0000-4000-8000-000000000000",
  // Las tres que faltaban. `/dev/pago` lo pisa casi toda prueba que compra, y
  // compilarlo tarde reconstruye el manifiesto de acciones de servidor: las
  // páginas ya dibujadas en los otros procesos pierden sus acciones y fallan con
  // «Failed to find Server Action», repartido por pantallas que no tienen nada
  // que ver entre sí (2026-09-20).
  "/dev/pago/00000000-0000-4000-8000-000000000000",
  "/dev/kyc/ref-inexistente",
  "/admin/conversaciones/00000000-0000-4000-8000-000000000000",
  "/publicar/00000000-0000-4000-8000-000000000000",
  "/admin",
  "/admin/disputas",
  "/admin/conversaciones",
  "/producto/00000000-0000-4000-8000-000000000000",
  "/producto/00000000-0000-4000-8000-000000000000/editar",
  "/pedido/00000000-0000-4000-8000-000000000000",
  "/chat/00000000-0000-4000-8000-000000000000",
  "/chat/00000000-0000-4000-8000-000000000000/oferta",
  "/chat/abrir/00000000-0000-4000-8000-000000000000",
  "/comprar/00000000-0000-4000-8000-000000000000",
  "/vendedor/no-existe",
  "/api/auth/get-session",
  "/api/salud",
  "/api/tareas/liberar",
  // Sin sesión responde 401 al momento; basta para compilarla (corrección 20).
  "/api/chat/00000000-0000-4000-8000-000000000000/eventos",
];

export default async function globalSetup() {
  // Contra una imagen ya compilada esto no cuesta nada y no estorba.
  const ctx = await request.newContext({ baseURL });

  const started = Date.now();
  // Se ignoran los códigos de respuesta: un 404 o un redirección compilan la ruta
  // igual, que es lo único que se busca aquí.
  await Promise.all(ROUTES.map((route) => ctx.get(route).catch(() => {})));
  await ctx.dispose();

  console.log(`Rutas compiladas en ${Math.round((Date.now() - started) / 1000)}s`);
}
