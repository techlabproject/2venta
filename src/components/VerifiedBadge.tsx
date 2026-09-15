// El distintivo solo se pinta cuando hay una verificación aprobada por el
// proveedor externo. Mostrarlo sin dato real detrás le mentiría al comprador sobre
// lo único que diferencia a 2venta de un grupo de compraventa cualquiera.
//
// Es una píldora petróleo con el visto en coral: la única vez en todo el producto
// que los dos colores de la marca aparecen juntos en un mismo elemento. Antes era
// texto pequeño del mismo tamaño y peso que la zona o el estado del artículo, así
// que la señal que sostiene la promesa entera se leía como un metadato más.
export function VerifiedBadge({
  className = "",
  label = "Verificado",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-cream ${className}`}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="8" fill="var(--color-accent)" />
        <path
          d="M4.5 8.2l2.3 2.3 4.7-4.7"
          fill="none"
          stroke="var(--color-on-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </span>
  );
}
