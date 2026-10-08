import { formatCop } from "@/lib/money";

/**
 * Compartir la ficha por WhatsApp (D-131). En Colombia un artículo se pasa por
 * WhatsApp antes que por cualquier otro lado, y quien vende es el primero que lo
 * quiere mandar. Es un enlace y no un botón con JavaScript: funciona sin cargar
 * nada y en cualquier teléfono abre la aplicación.
 *
 * La dirección pública sale de `BETTER_AUTH_URL`, que es la que ve la gente: detrás
 * de CloudFront la del pedido es la del balanceador.
 */
export function CompartirWhatsApp({
  id,
  title,
  priceCop,
}: {
  id: string;
  title: string;
  priceCop: number;
}) {
  const base = process.env.BETTER_AUTH_URL ?? "";
  const texto = `${title}, a ${formatCop(priceCop)} en 2venta: ${base}/producto/${id}`;
  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Compartir por WhatsApp"
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium shadow-xs transition duration-200 ease-salida hover:border-brand/30 hover:bg-ph active:scale-[0.98]"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
      </svg>
      Compartir
    </a>
  );
}
