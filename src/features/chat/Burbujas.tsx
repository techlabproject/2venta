import { REDACTION_NOTICE } from "./redact";
import { formatCop } from "@/lib/money";
import { mediaUrl } from "@/lib/media";
import type { Message, Offer } from "./queries";

// La conversación en burbujas (S-36, D-91).
//
// Antes era una lista de recuadros sin hora ni separadores, y las ofertas vivían en
// un bloque aparte, debajo de todo, desconectadas de lo que se estaba hablando. Un
// chat se lee por cuándo pasó cada cosa, así que mensajes y ofertas se mezclan en
// una sola línea de tiempo ordenada por fecha.

type Entrada =
  | { tipo: "mensaje"; at: Date; m: Message }
  | { tipo: "oferta"; at: Date; o: Offer };

const HORA = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

const DIA_LARGO = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  timeZone: "America/Bogota",
});

/** La fecha en Bogotá, como «2026-09-18», para agrupar por día de calendario. */
const claveDia = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Bogota",
  }).format(d);

function separador(fecha: Date, hoy: Date): string {
  const dia = claveDia(fecha);
  if (dia === claveDia(hoy)) return "Hoy";
  const ayer = new Date(hoy.getTime() - 86_400_000);
  if (dia === claveDia(ayer)) return "Ayer";
  return DIA_LARGO.format(fecha);
}

const ESTADO_OFERTA: Record<Offer["status"], string> = {
  pendiente: "Esperando respuesta",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  vencida: "Venció sin respuesta",
};

export function Burbujas({
  messages,
  offers,
  userId,
  vacio,
}: {
  messages: Message[];
  offers: Offer[];
  userId: string;
  /** Qué decir cuando todavía no se ha escrito nada. */
  vacio: React.ReactNode;
}) {
  const entradas: Entrada[] = [
    ...messages.map((m): Entrada => ({ tipo: "mensaje", at: m.created_at, m })),
    ...offers.map((o): Entrada => ({ tipo: "oferta", at: o.created_at, o })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  if (entradas.length === 0) return <>{vacio}</>;

  const hoy = new Date();

  // El separador se decide ANTES de dibujar, comparando cada entrada con la
  // anterior. Llevar la cuenta con una variable dentro del `map` es mutar estado
  // durante el render, y React 19 lo prohíbe con razón: el resultado depende del
  // orden en que se evalúen los hijos.
  const conDia = entradas.map((e, i) => ({
    e,
    abreDia: i === 0 || claveDia(e.at) !== claveDia(entradas[i - 1].at),
  }));

  return (
    <ol data-testid="mensajes" className="flex flex-col gap-2">
      {conDia.map(({ e, abreDia }) => (
        <li key={`${e.tipo}-${e.tipo === "mensaje" ? e.m.id : e.o.id}`}>
          {abreDia && (
            <p className="my-3 text-center">
              <span className="rounded-full bg-ph px-3 py-1 text-[11px] font-medium text-muted">
                {separador(e.at, hoy)}
              </span>
            </p>
          )}
          {e.tipo === "mensaje" ? (
            <Mensaje m={e.m} mio={e.m.sender_id === userId} />
          ) : (
            <TarjetaOferta o={e.o} mia={e.o.offered_by === userId} />
          )}
        </li>
      ))}
    </ol>
  );
}

function Mensaje({ m, mio }: { m: Message; mio: boolean }) {
  return (
    <div className={`flex ${mio ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-xs ${
          mio
            ? "rounded-br-sm bg-brand text-cream"
            : "rounded-bl-sm bg-white ring-1 ring-line"
        }`}
      >
        {m.image_path && (
          // La foto va dentro de la burbuja y con su proporción intacta: recortarla
          // a un cuadrado esconde justo el detalle por el que alguien la pidió.
          // La dirección la arma el servidor con `mediaUrl()`; la base solo guarda
          // la clave del bucket.
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={mediaUrl(m.image_path)}
            alt="Foto que mandó quien vende"
            className="mb-1.5 max-h-72 w-full rounded-xl bg-ph object-contain"
          />
        )}

        {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}

        {m.redactions.length > 0 && (
          // El mockup lo dice así: se oculta y se explica por qué. Un mensaje
          // bloqueado sin explicación se lee como una falla.
          <p
            data-testid="aviso-filtro"
            className={`mt-1.5 text-xs ${mio ? "text-accent-on-brand" : "text-warn"}`}
          >
            {REDACTION_NOTICE}
          </p>
        )}

        {/* La hora dentro de la burbuja y alineada al final, como en cualquier
            chat: fuera obligaría a una fila propia por mensaje. */}
        <time
          dateTime={m.created_at.toISOString()}
          className={`mt-0.5 block text-right text-[11px] ${mio ? "text-cream/60" : "text-muted"}`}
        >
          {HORA.format(m.created_at)}
        </time>
      </div>
    </div>
  );
}

function TarjetaOferta({ o, mia }: { o: Offer; mia: boolean }) {
  return (
    <div className={`flex ${mia ? "justify-end" : "justify-start"}`}>
      <div
        data-testid="oferta"
        className="max-w-[85%] rounded-2xl border border-accent-edge/40 bg-accent/10 px-3.5 py-2.5 text-sm shadow-xs"
      >
        <p className="text-xs font-medium tracking-wide text-accent-text uppercase">
          {mia ? "Ofreciste" : "Te ofrecieron"}
        </p>
        <p className="font-title text-lg font-semibold tabular-nums">
          {formatCop(o.price_cop)}
        </p>
        <p className="text-xs text-muted">{ESTADO_OFERTA[o.status]}</p>
        <time
          dateTime={o.created_at.toISOString()}
          className="mt-0.5 block text-right text-[11px] text-muted"
        >
          {HORA.format(o.created_at)}
        </time>
      </div>
    </div>
  );
}
