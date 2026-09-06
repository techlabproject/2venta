// El distintivo solo se pinta cuando hay una verificación aprobada por el
// proveedor externo. Mostrarlo sin dato real detrás le mentiría al comprador sobre
// lo único que diferencia a 2venta de un grupo de compraventa cualquiera.
export function VerifiedBadge({
  className = "",
  label = "Verificado",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium text-brand ${className}`}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
        <circle cx="8" cy="8" r="8" fill="currentColor" />
        <path
          d="M4.5 8.2l2.3 2.3 4.7-4.7"
          fill="none"
          stroke="#F4F5F1"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </span>
  );
}
