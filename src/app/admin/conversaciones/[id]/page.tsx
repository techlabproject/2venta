import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/session";
import { getReportedConversation, REPORT_REASON_LABEL } from "@/features/chat/queries";
import { formatCop } from "@/lib/money";
import { AppHeader } from "@/components/AppHeader";
import { mediaUrl } from "@/lib/media";
import { Volver } from "@/components/Volver";

// Leer una conversación reportada, para moderarla (S-37, D-92).
//
// Es de solo lectura a propósito: quien modera juzga lo que pasó, no participa. Y
// solo abre si la conversación tiene un reporte sin resolver; esa condición vive en
// la consulta, no aquí.
export const dynamic = "force-dynamic";

const ESTADO_OFERTA: Record<string, string> = {
  pendiente: "esperando respuesta",
  aceptada: "aceptada",
  rechazada: "rechazada",
  vencida: "vencida",
};

const hora = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

export default async function ConversacionReportada({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await currentAdmin();
  if (!admin) notFound();

  const { id } = await params;
  const data = await getReportedConversation(id);
  if (!data) notFound();

  const { conversation, messages, offers, reportes } = data;
  const quien = (userId: string) =>
    userId === conversation.seller_id
      ? `${conversation.seller_alias} · vende`
      : `${conversation.buyer_alias} · compra`;

  // Mensajes, ofertas y reportes en una sola línea de tiempo: quien modera tiene
  // que ver qué se dijo antes del reporte y qué después.
  type Entrada =
    | { tipo: "mensaje"; at: Date; m: (typeof messages)[number] }
    | { tipo: "oferta"; at: Date; o: (typeof offers)[number] }
    | { tipo: "reporte"; at: Date; r: (typeof reportes)[number] };
  const entradas: Entrada[] = [
    ...messages.map((m): Entrada => ({ tipo: "mensaje", at: m.created_at, m })),
    ...offers.map((o): Entrada => ({ tipo: "oferta", at: o.created_at, o })),
    ...reportes.map((r): Entrada => ({ tipo: "reporte", at: r.created_at, r })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <Volver href="/admin/conversaciones" fijo>Conversaciones reportadas</Volver>
        <h1 className="mt-4 font-title text-2xl font-semibold">
          {conversation.listing_title}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {conversation.buyer_alias} (compra) y {conversation.seller_alias}{" "}
          (vende)
        </p>

        <ol data-testid="conversacion" className="mt-6 flex flex-col gap-3">
          {entradas.map((e) => {
            if (e.tipo === "reporte") {
              return (
                <li
                  key={`r-${e.r.reporter_id}`}
                  className="rounded-xl bg-warn/10 px-3 py-2 text-xs font-medium text-warn"
                >
                  {e.r.reporter_id === conversation.seller_id
                    ? conversation.seller_alias
                    : conversation.buyer_alias}{" "}
                  reportó la conversación ({REPORT_REASON_LABEL[e.r.reason] ?? e.r.reason})
                  · {hora.format(e.at)}
                  {/* En su propio renglón: la hora termina en «p. m.» y un punto
                      detrás quedaba doble (Luna). */}
                  <span className="block font-normal">
                    Desde aquí no le llega lo que mande la otra persona.
                  </span>
                </li>
              );
            }
            if (e.tipo === "oferta") {
              return (
                <li
                  key={`o-${e.o.id}`}
                  className="rounded-2xl bg-white p-3 shadow-xs ring-1 ring-line"
                >
                  <p className="text-xs font-medium text-muted">
                    {quien(e.o.offered_by)} · {hora.format(e.at)}
                  </p>
                  <p className="mt-1 text-sm">
                    Oferta de <span className="font-medium">{formatCop(e.o.price_cop)}</span>{" "}
                    · {ESTADO_OFERTA[e.o.status] ?? e.o.status}
                  </p>
                </li>
              );
            }
            const m = e.m;
            return (
              <li
                key={m.id}
                className="rounded-2xl bg-white p-3 shadow-xs ring-1 ring-line"
              >
                <p className="text-xs font-medium text-muted">
                  {quien(m.sender_id)} · {hora.format(m.created_at)}
                </p>
                {m.image_path && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={mediaUrl(m.image_path)}
                    alt="Foto que se mandó en la conversación"
                    className="mt-2 max-h-80 rounded-xl bg-ph object-contain"
                  />
                )}
                {m.body && <p className="mt-1 text-sm">{m.body}</p>}
              </li>
            );
          })}
        </ol>

        {entradas.every((e) => e.tipo === "reporte") && (
          <p className="mt-6 rounded-2xl bg-white p-6 text-sm shadow-xs ring-1 ring-line">
            No hay mensajes en esta conversación.
          </p>
        )}
      </main>
    </>
  );
}
