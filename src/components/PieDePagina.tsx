import Link from "next/link";
import { CORREO_AYUDA } from "@/lib/contacto";

/**
 * Pie de página de toda la app (filas 80 y 81, D-133): quién es 2venta, dónde
 * pedir ayuda y los términos. Es HTML del servidor, así que existe sin JavaScript.
 *
 * En el chat no se dibuja (`globals.css`): la conversación ocupa la pantalla entera
 * y el pie quedaría debajo del campo de escribir.
 */
export function PieDePagina() {
  return (
    // `mt-auto`: en una pantalla corta el pie se queda abajo y no a media altura (el
    // `body` es una columna flexible).
    <footer data-pie className="mt-auto pt-12">
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-ink2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted">
            2venta · Usado con pago protegido en Bogotá
          </p>
          <nav
            aria-label="Sobre 2venta"
            className="flex flex-wrap gap-x-5 gap-y-2"
          >
            <Link
              href="/quienes-somos"
              className="hover:text-ink hover:underline"
            >
              Quiénes somos
            </Link>
            <Link href="/ayuda" className="hover:text-ink hover:underline">
              Ayuda
            </Link>
            <Link href="/legal" className="hover:text-ink hover:underline">
              Términos y datos
            </Link>
            <a
              href={`mailto:${CORREO_AYUDA}`}
              className="hover:text-ink hover:underline"
            >
              {CORREO_AYUDA}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
