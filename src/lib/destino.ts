/**
 * El `volver` que viaja por entrar → crear cuenta → confirmar celular, filtrado.
 *
 * Solo se admiten rutas de esta misma aplicación. Una URL completa aquí sería un
 * salto a otro sitio justo después de que la persona entregó su contraseña, y
 * `//otro.com` o `/\otro.com` los navegadores los leen como otro dominio.
 *
 * No importa nada: lo usan componentes de cliente y de servidor.
 */
export function destinoInterno(crudo: string | null | undefined): string | null {
  if (!crudo || !crudo.startsWith("/")) return null;
  if (crudo.startsWith("//") || crudo.startsWith("/\\")) return null;
  return crudo;
}

/** `?volver=…` listo para pegar a una ruta, o nada si no hay a dónde volver. */
export function conVolver(ruta: string, volver: string | null | undefined): string {
  const destino = destinoInterno(volver);
  if (!destino) return ruta;
  const sep = ruta.includes("?") ? "&" : "?";
  return `${ruta}${sep}volver=${encodeURIComponent(destino)}`;
}
