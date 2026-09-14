// La cara de una persona, o sus iniciales si todavía no puso foto.
//
// Recibe la dirección ya resuelta, nunca la clave del bucket: `mediaUrl()` lee una
// variable que no existe en el navegador, así que armarla aquí rompería cualquier
// pantalla de cliente que use este componente.

const SIZE = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-11 w-11 text-sm",
  lg: "h-20 w-20 text-xl",
} as const;

/** Dos letras como máximo: "Camila V." da "CV", "andres" da "A". */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  src,
  name,
  size = "md",
  className = "",
}: {
  src: string | null;
  name: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const base = `${SIZE[size]} shrink-0 overflow-hidden rounded-full ${className}`;

  if (src) {
    // El bucket sirve la imagen ya optimizada; el optimizador de Next exigiría
    // declarar cada host y no aporta nada a 40 px de lado.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" aria-hidden className={`${base} object-cover`} />;
  }

  return (
    <span
      aria-hidden
      className={`${base} flex items-center justify-center bg-brand-d font-title font-semibold text-accent-on-brand ring-1 ring-cream/25`}
    >
      {initials(name) || "2"}
    </span>
  );
}
