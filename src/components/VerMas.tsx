import Link from "next/link";

/**
 * Al final de una lista paginada (correcciones 33 y 34): cuántos se ven de cuántos
 * y «Ver más». Es un enlace de verdad a la página siguiente: con JavaScript lo nuevo
 * aparece debajo sin mover el scroll; sin JavaScript, es una página que un buscador
 * sigue (D-25).
 */
export function VerMas({
  mostrados,
  total,
  href,
  que = "artículos",
}: {
  mostrados: number;
  total: number;
  href: string;
  que?: string;
}) {
  if (total <= mostrados) return null;
  return (
    <nav
      aria-label="Más resultados"
      data-testid="ver-mas"
      className="mt-8 flex flex-col items-center gap-3"
    >
      <p className="text-sm text-muted tabular-nums">
        Ves {mostrados} de {total} {que}
      </p>
      <Link
        href={href}
        scroll={false}
        prefetch={false}
        className="inline-flex items-center justify-center rounded-xl border border-brand/25 bg-white px-6 py-3 text-sm font-medium text-ink shadow-xs transition duration-200 ease-salida hover:bg-ph active:scale-[0.98]"
      >
        Ver más
      </Link>
    </nav>
  );
}
