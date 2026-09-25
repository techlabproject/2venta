/**
 * Consejos para el encuentro en persona (corrección 46, D-125). Van al elegir «Nos
 * vemos en persona» y en el pedido. Sin nada del servidor: lo usan las dos pantallas.
 */
export function ConsejosEncuentro() {
  return (
    <div
      data-testid="consejos-encuentro"
      className="rounded-2xl bg-white p-4 text-sm shadow-xs ring-1 ring-line"
    >
      <p className="font-medium">Para el encuentro</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-ink2">
        <li>Mejor de día y en un lugar concurrido, nunca en una casa.</li>
        <li>Revisa el producto antes de dictar el código: el código libera el pago.</li>
        <li>No entregues ni recibas efectivo. El pago ya está en 2venta.</li>
        <li>Cuéntale a alguien a dónde vas y a qué hora.</li>
      </ul>
    </div>
  );
}
