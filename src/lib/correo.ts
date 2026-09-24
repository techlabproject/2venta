/**
 * Reglas del correo para los formularios de entrar y registrarse (corrección 6).
 *
 * Es una revisión de forma, no una garantía de que el correo exista: eso solo lo
 * sabe quien lo recibe. Lo que evita es el caso de Catalina —`cata@mail`, sin
 * dominio— y los dominios mal escritos, que crean cuentas cuyo correo no recibe
 * nada (y la recuperación de contraseña llega ahí).
 *
 * No importa nada: lo usan componentes de cliente y pruebas unitarias.
 */

const FORMA = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Qué está mal en el correo, en palabras de persona; `null` si se ve bien. */
export function problemaDeCorreo(crudo: string): string | null {
  const correo = crudo.trim();
  if (!correo) return "Escribe tu correo.";
  if (/\s/.test(correo)) return "¡Uy! El correo no lleva espacios.";
  const arrobas = (correo.match(/@/g) ?? []).length;
  if (arrobas === 0) return "¡Uy! Le falta la @. Debería verse como nombre@gmail.com.";
  if (arrobas > 1) return "Tiene más de una @. Debería verse como nombre@gmail.com.";
  const [usuario, dominio] = correo.split("@");
  if (!usuario) return "Falta lo que va antes de la @, por ejemplo catalina@gmail.com.";
  if (!dominio) return "Falta lo que va después de la @, por ejemplo @gmail.com.";
  if (!dominio.includes(".")) {
    return `Le falta el final del dominio: ¿${usuario}@${dominio}.com?`;
  }
  if (correo.length > 254 || usuario.length > 64) {
    return "Ese correo es demasiado largo. Revisa que esté bien copiado.";
  }
  if (
    /\.\./.test(correo) ||
    usuario.startsWith(".") ||
    usuario.endsWith(".") ||
    dominio.startsWith(".") ||
    dominio.endsWith(".")
  ) {
    return "Revisa los puntos del correo: hay uno de más o fuera de lugar.";
  }
  // Cada parte del dominio: letras, números y guiones, sin guion en las puntas
  // (`-gmail.com` no existe). Se admiten tildes y eñes: hay dominios así.
  if (!dominio.split(".").every((parte) => /^[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?$/u.test(parte))) {
    return "Revisa lo que va después de la @: tiene un carácter que no va ahí.";
  }
  if (!FORMA.test(correo)) return "Revisa el correo: debería verse como nombre@gmail.com.";
  return null;
}

// Los que más se usan en Colombia. Solo se sugiere hacia uno de estos.
const DOMINIOS = [
  "gmail.com",
  "hotmail.com",
  "hotmail.es",
  "outlook.com",
  "outlook.es",
  "yahoo.com",
  "yahoo.es",
  "icloud.com",
  "live.com",
];

function distancia(a: string, b: string): number {
  const filas = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) filas[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cambio = a[i - 1] === b[j - 1] ? 0 : 1;
      filas[i][j] = Math.min(filas[i - 1][j] + 1, filas[i][j - 1] + 1, filas[i - 1][j - 1] + cambio);
      // Letras vecinas intercambiadas (gmial) cuentan como un solo error.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        filas[i][j] = Math.min(filas[i][j], filas[i - 2][j - 2] + 1);
      }
    }
  }
  return filas[a.length][b.length];
}

/**
 * «¿Quisiste decir…?»: el correo con el dominio corregido, si el escrito se
 * parece mucho a uno común sin serlo (`gmial.com`, `hotmal.com`, `gmail.con`).
 */
export function sugerenciaDeCorreo(crudo: string): string | null {
  const correo = crudo.trim().toLowerCase();
  const partes = correo.split("@");
  if (partes.length !== 2 || !partes[0] || !partes[1]) return null;
  const [usuario, dominio] = partes;
  if (DOMINIOS.includes(dominio)) return null;
  // `.co` es el dominio de Colombia y hay miles legítimos (hotmail.co, empresas):
  // no se «corrige» a `.com`. Gmail no tiene `.co`, así que ese sí.
  if (dominio.endsWith(".co") && dominio !== "gmail.co") return null;
  let mejor: { dominio: string; d: number } | null = null;
  for (const conocido of DOMINIOS) {
    const d = distancia(dominio, conocido);
    if (d <= 2 && (!mejor || d < mejor.d)) mejor = { dominio: conocido, d };
  }
  return mejor ? `${usuario}@${mejor.dominio}` : null;
}
