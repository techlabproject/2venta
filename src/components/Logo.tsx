// Isotipo de marca: una flecha circular (ciclo de reuso) que envuelve el 2.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        viewBox="0 0 100 100"
        className="h-full w-auto"
        role="img"
        aria-label="2venta"
      >
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="8"
          strokeDasharray="198 266"
          strokeLinecap="round"
          transform="rotate(-58 50 50)"
        />
        <text
          x="50"
          y="64"
          textAnchor="middle"
          fontFamily="var(--font-poppins), sans-serif"
          fontWeight="700"
          fontSize="44"
          fill="currentColor"
        >
          2
        </text>
      </svg>
      <span className="font-title text-lg font-semibold tracking-tight">
        2venta
      </span>
    </span>
  );
}
