/**
 * El recorrido de la persona dentro de 2venta, para que «Volver» lleve a la
 * pantalla de la que vino y no a un destino fijo (corrección 1, 2026-09-22).
 *
 * Con destino fijo, quien abría un pedido desde «Tu actividad» y tocaba «Volver»
 * caía en la portada. El historial del navegador tampoco sirve tal cual: guarda
 * los formularios intermedios (entrar, pagar), y «atrás» desde el chat recién
 * abierto devolvía a la pantalla de iniciar sesión.
 *
 * Vive en `sessionStorage`: es de esta pestaña y muere con ella. Solo cliente.
 */

const CLAVE = "2venta:rastro";
const MAXIMO = 40;

// Pantallas de paso: se atraviesan camino a otra cosa. Volver a ellas no tiene
// sentido —la de iniciar sesión, con la sesión ya iniciada; la de pagar, con el
// artículo ya reservado—, así que «Volver» las salta.
const DE_PASO = [
  /^\/(ingresar|registro|verificar|bienvenida|recuperar)(\/|$)/,
  /^\/chat\/abrir\//,
  /^\/comprar\//,
  /^\/dev\//,
];

const camino = (ruta: string) => ruta.split("?")[0];
const esDePaso = (ruta: string) => DE_PASO.some((re) => re.test(camino(ruta)));

function leer(): string[] {
  try {
    const crudo = JSON.parse(sessionStorage.getItem(CLAVE) ?? "[]");
    return Array.isArray(crudo) ? crudo.filter((r) => typeof r === "string") : [];
  } catch {
    return [];
  }
}

function guardar(pila: string[]): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(pila));
  } catch {
    // Navegación privada o almacenamiento bloqueado: «Volver» usa su destino fijo.
  }
}

/**
 * Anota que la persona llegó a `ruta`.
 *
 * Llegar a una pantalla que ya estaba en el recorrido es volver a ella, y lo que
 * había después se descarta. La misma pantalla con otros parámetros (cambiar un
 * filtro de la búsqueda) reemplaza a la anterior en vez de apilarse: si no,
 * «Volver» recorría uno por uno los filtros que se probaron.
 */
export function registrar(ruta: string): void {
  const pila = leer();
  const i = pila.lastIndexOf(ruta);
  if (i >= 0) return guardar(pila.slice(0, i + 1));
  const cima = pila.at(-1);
  if (cima && camino(cima) === camino(ruta)) {
    return guardar([...pila.slice(0, -1), ruta]);
  }
  guardar([...pila, ruta].slice(-MAXIMO));
}

/** La pantalla a la que debe llevar «Volver» desde `actual`, si se sabe. */
export function anterior(actual: string): string | null {
  const pila = leer();
  for (let i = pila.length - 1; i >= 0; i--) {
    const ruta = pila[i];
    if (camino(ruta) === camino(actual) || esDePaso(ruta)) continue;
    return ruta;
  }
  return null;
}
