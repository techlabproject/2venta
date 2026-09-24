/**
 * La versión vigente de los Términos y la Política de datos (corrección 11).
 *
 * Al registrarse se guarda la versión que la persona aceptó y cuándo: es la prueba
 * de consentimiento que piden la Ley 1581 y el artículo 50 de la Ley 1480, y lo que
 * permite pedir que se acepte de nuevo cuando el texto cambie. Cambiar el texto de
 * `ContenidoLegal` sin subir este número deja a todos con un consentimiento sobre
 * algo que ya no dice lo mismo.
 *
 * Sin importaciones: lo leen el formulario de registro (cliente) y el servidor.
 */
export const VERSION_TERMINOS = "1";

/** Mientras el abogado no lo apruebe, se muestra como borrador (Nicolás, 2026-09-24). */
export const TERMINOS_EN_REVISION = true;
