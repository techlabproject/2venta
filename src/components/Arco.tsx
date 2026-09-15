// El arco del isotipo —el ciclo de reuso que envuelve el 2— usado en grande como
// recurso gráfico (D-85).
//
// Estaba solo dentro del logo, a 32 px, donde nadie lo lee como una forma. Una
// marca con personalidad repite su gesto en tamaños donde ya no es un logo sino
// una textura: es lo que hace que una franja de color deje de ser un rectángulo.
//
// Es decorativo y solo decorativo: `aria-hidden`, sin texto dentro y sin ninguna
// información que no esté también escrita al lado.
export function Arco({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none select-none ${className}`}
    >
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.14"
        strokeWidth="8"
      />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeDasharray="198 266"
        strokeLinecap="round"
        transform="rotate(-58 50 50)"
      />
    </svg>
  );
}
