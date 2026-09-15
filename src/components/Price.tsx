import { formatCop } from "@/lib/money";

// El precio es lo que más mira un comprador y lo que decide la visita. Tenía el
// mismo tratamiento que el título del artículo, apenas un paso de tamaño por
// encima; aquí queda en un solo sitio, con el petróleo oscuro de marca (que estaba
// declarado y sin usar) y cifras tabulares para que las columnas de dígitos se
// alineen entre tarjetas.
const SIZE = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-[2.25rem] leading-none",
} as const;

export function Price({
  cop,
  size = "md",
  className = "",
}: {
  cop: number;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  return (
    <p
      className={`font-title ${SIZE[size]} font-bold tracking-tight text-brand-d tabular-nums ${className}`}
    >
      {formatCop(cop)}
    </p>
  );
}
