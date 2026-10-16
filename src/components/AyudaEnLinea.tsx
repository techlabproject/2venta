import Link from "next/link";

/**
 * «¿Necesitas ayuda?» donde la gente más lo busca: al pagar y en el pedido (fila
 * 81, D-133). Un enlace discreto, no un botón: la acción de la pantalla sigue siendo
 * la del coral.
 */
export function AyudaEnLinea() {
  return (
    <p className="mt-6 text-center text-sm text-muted">
      <Link href="/ayuda" className="text-brand underline">
        ¿Necesitas ayuda?
      </Link>
    </p>
  );
}
