import type { OrderStatus } from "./orders";

// Seguimiento del pedido (pantalla 1j del mockup, D-83).
//
// Antes esto era un rótulo con el estado arriba y una lista de «Movimientos» abajo:
// la misma información, repartida en dos sitios y sin decir qué falta. Aquí se ve de
// una vez dónde va el pedido, cuándo pasó cada cosa y qué viene después.
//
// Los pasos cumplidos salen de `order_events`, no del estado actual. Importa porque
// un pedido puede saltarse pasos —la entrega en persona va de 'pagado' a 'liberado'
// sin pasar por 'despachado'— y porque así cada paso muestra su hora de verdad.

type Evento = { to_status: string; created_at: Date };

type Paso = {
  /** El estado que marca este paso como cumplido. */
  estado: OrderStatus;
  titulo: string;
  /** Qué pasa aquí, para quien nunca ha usado un pago retenido. */
  detalle: string;
};

const CON_ENVIO: Paso[] = [
  {
    estado: "pagado",
    titulo: "Pago recibido y guardado",
    detalle: "Tu plata está en 2venta, no con el vendedor.",
  },
  {
    estado: "despachado",
    titulo: "El vendedor despachó",
    detalle: "Ya lo entregó a la transportadora.",
  },
  {
    estado: "entregado",
    titulo: "Entregado",
    detalle: "La transportadora reportó la entrega.",
  },
  {
    estado: "liberado",
    titulo: "Le pagamos al vendedor",
    detalle:
      "Cuando confirmas que recibiste, o a los siete días de la entrega.",
  },
];

const EN_PERSONA: Paso[] = [
  {
    estado: "pagado",
    titulo: "Pago recibido y guardado",
    detalle: "Tu plata está en 2venta, no con el vendedor.",
  },
  {
    estado: "liberado",
    titulo: "Le dictas el código y le pagamos al vendedor",
    detalle:
      "Revisa el producto antes de dictarlo: el código libera el dinero.",
  },
];

const hora = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

/** Un pedido que se salió del camino no se dibuja como si siguiera en él. */
const DESVIOS: Partial<
  Record<OrderStatus, { titulo: string; detalle: string }>
> = {
  cancelado: {
    titulo: "Pedido cancelado",
    detalle: "No se cobró nada y el artículo volvió al catálogo.",
  },
  reembolsado: {
    titulo: "Te devolvimos el dinero",
    detalle: "El pedido terminó con reembolso al comprador.",
  },
};

export function OrderTimeline({
  status,
  presencial,
  events,
}: {
  status: OrderStatus;
  presencial: boolean;
  events: Evento[];
}) {
  const desvio = DESVIOS[status];
  if (desvio) {
    return (
      <div
        data-testid="seguimiento"
        className="mt-5 rounded-2xl bg-white shadow-xs p-5 ring-1 ring-line"
      >
        <p className="font-title font-semibold">{desvio.titulo}</p>
        <p className="mt-1 text-sm text-ink2">{desvio.detalle}</p>
      </div>
    );
  }

  const pasos = presencial ? EN_PERSONA : CON_ENVIO;

  // La hora de cada paso, de la primera vez que el pedido llegó a ese estado. Un
  // webhook repetido no puede mover la fecha que ya se le mostró a alguien.
  const cuando = new Map<string, Date>();
  for (const e of events) {
    if (!cuando.has(e.to_status)) cuando.set(e.to_status, e.created_at);
  }

  // Un pedido que llegó a un paso pasó por los anteriores, tenga o no evento
  // propio: la entrega en persona salta de 'pagado' a 'liberado' y aun así el
  // dinero estuvo guardado.
  let ultimoCumplido = -1;
  pasos.forEach((p, i) => {
    if (cuando.has(p.estado)) ultimoCumplido = i;
  });

  const enDisputa = status === "en_disputa";

  return (
    <ol data-testid="seguimiento" className="mt-5 flex flex-col">
      {pasos.map((paso, i) => {
        const cumplido = i <= ultimoCumplido;
        // El paso en curso es el primero que falta, y solo si el pedido sigue su
        // camino: con un reclamo abierto nada avanza hasta que alguien decida.
        const actual = !cumplido && i === ultimoCumplido + 1 && !enDisputa;
        const fecha = cuando.get(paso.estado);

        return (
          <li key={paso.estado} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Punto cumplido={cumplido} actual={actual} />
              {i < pasos.length - 1 && (
                <span
                  aria-hidden
                  className={`w-0.5 flex-1 transition-colors duration-300 ease-salida ${cumplido ? "bg-brand" : "bg-line"}`}
                />
              )}
            </div>

            <div className={`pb-6 ${i === pasos.length - 1 ? "pb-0" : ""}`}>
              <p
                className={`text-sm font-medium ${
                  cumplido ? "text-ink" : actual ? "text-ink" : "text-muted"
                }`}
              >
                {paso.titulo}
              </p>
              {fecha ? (
                <time className="mt-0.5 block text-xs text-muted">
                  {hora.format(fecha)}
                </time>
              ) : (
                <p className="mt-0.5 text-xs text-muted">{paso.detalle}</p>
              )}
            </div>
          </li>
        );
      })}

      {enDisputa && (
        <li className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              aria-hidden
              className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full bg-warn ring-4 ring-warn/20"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-warn">
              Con un reclamo abierto
            </p>
            <p className="mt-0.5 text-xs text-muted">
              El dinero no se mueve mientras lo revisamos.
            </p>
          </div>
        </li>
      )}
    </ol>
  );
}

function Punto({ cumplido, actual }: { cumplido: boolean; actual: boolean }) {
  if (cumplido) {
    return (
      <span
        aria-hidden
        className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full bg-brand"
      />
    );
  }
  if (actual) {
    // El coral marca dónde va el pedido ahora mismo. Es el único de la pantalla
    // que no es un botón, y por eso el ojo lo encuentra. Late despacio (D-86)
    // porque es el paso que todavía no ha ocurrido: el latido es lo que separa
    // «esto está pasando» de «esto ya pasó», sin una palabra más.
    return (
      <span
        aria-hidden
        className="mt-1 h-3.5 w-3.5 shrink-0 animate-latir rounded-full bg-accent"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-line bg-cream"
    />
  );
}
