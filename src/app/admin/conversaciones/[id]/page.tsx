import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/session";
import { getReportedConversation } from "@/features/chat/queries";
import { AppHeader } from "@/components/AppHeader";
import { mediaUrl } from "@/lib/media";
import { Volver } from "@/components/Volver";

// Leer una conversación reportada, para moderarla (S-37, D-92).
//
// Es de solo lectura a propósito: quien modera juzga lo que pasó, no participa. Y
// solo abre si la conversación tiene un reporte sin resolver; esa condición vive en
// la consulta, no aquí.
export const dynamic = "force-dynamic";

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

  const { conversation, messages } = data;

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
          {messages.map((m) => {
            const deVendedor = m.sender_id === conversation.seller_id;
            return (
              <li
                key={m.id}
                className="rounded-2xl bg-white p-3 shadow-xs ring-1 ring-line"
              >
                <p className="text-xs font-medium text-muted">
                  {deVendedor
                    ? `${conversation.seller_alias} · vende`
                    : `${conversation.buyer_alias} · compra`}{" "}
                  · {hora.format(m.created_at)}
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

        {messages.length === 0 && (
          <p className="mt-6 rounded-2xl bg-white p-6 text-sm shadow-xs ring-1 ring-line">
            No hay mensajes en esta conversación.
          </p>
        )}
      </main>
    </>
  );
}
