/**
 * Reglas de los datos del vendedor (corrección 15). Sin importaciones del servidor:
 * las usan el formulario y la acción.
 */

/** Celular (10 dígitos que empiezan por 3) o fijo con indicativo (60 + 8 dígitos). */
export function telefonoValido(crudo: string): string | null {
  let d = crudo.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("57")) d = d.slice(2);
  return /^(3\d{9}|60\d{8})$/.test(d) ? d : null;
}

export function problemaDeDireccion(crudo: string): string | null {
  const d = crudo.trim();
  if (!d) return "Escribe tu dirección de notificaciones.";
  if (d.length < 8 || !/\d/.test(d)) {
    return "Escribe la dirección completa, con calle y número (Calle 72 # 10-34).";
  }
  return null;
}

export const RUT_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Una cuenta de empresa vende pero no compra (corrección 17): una compra de empresa
 * pide factura, y eso no existe hasta la corrección 47.
 */
export const EMPRESA_NO_COMPRA =
  "Esta es una cuenta de empresa: en 2venta las empresas venden, pero no compran. Si quieres comprar algo, hazlo desde una cuenta personal, con otro celular.";

/**
 * La cuenta del equipo (rol admin) solo administra (corrección 48, D-127): no compra
 * ni vende, para no moderar publicaciones, reclamos o disputas en las que tenga
 * interés.
 */
export const EQUIPO_NO_COMPRA =
  "Estás en la cuenta del equipo de 2venta: desde aquí no se compra ni se vende. Para eso, usa tu cuenta personal.";

export function mensajeSinCompras(motivo: "empresa" | "equipo"): string {
  return motivo === "equipo" ? EQUIPO_NO_COMPRA : EMPRESA_NO_COMPRA;
}
