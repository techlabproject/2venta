import { notFound } from "next/navigation";
import Link from "next/link";
import { currentAdmin } from "@/lib/session";
import {
  listOpenChatReports,
  REPORT_REASON_LABEL,
} from "@/features/chat/queries";
import { AppHeader } from "@/components/AppHeader";
import { Volver } from "@/components/Volver";

// La cola de conversaciones reportadas (S-37, D-92).
//
// Sin esto, el botón de reportar sería un botón que no hace nada, que es peor que
// no tenerlo: le promete a alguien que está pasando un mal rato que hay alguien al
// otro lado.
export const dynamic = "force-dynamic";

const fecha = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

export default async function Conversaciones() {
  const admin = await currentAdmin();
  if (!admin) notFound();

  const reports = await listOpenChatReports();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <Volver href="/admin">Moderación</Volver>
        <h1 className="mt-4 font-title text-2xl font-semibold">
          Conversaciones reportadas
        </h1>
        <p
          data-testid="cola-conversaciones"
          className="mt-1 text-sm text-muted"
        >
          {reports.length === 1
            ? "1 reporte sin revisar"
            : `${reports.length} reportes sin revisar`}
        </p>

        {reports.length === 0 && (
          <p className="mt-6 rounded-2xl bg-white p-6 text-sm shadow-xs ring-1 ring-line">
            Nada pendiente. Aquí llegan las conversaciones que alguien reportó
            por insultos, contenido sexual o intento de estafa.
          </p>
        )}

        <ul className="mt-5 flex flex-col gap-3">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-line"
            >
              <p className="text-xs font-medium tracking-wide text-warn uppercase">
                {REPORT_REASON_LABEL[r.reason] ?? r.reason}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-medium">{r.reporter_alias}</span> reportó
                a <span className="font-medium">{r.reported_alias}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Sobre «{r.listing_title}» · {fecha.format(r.created_at)}
              </p>

              {r.detail && (
                <p className="mt-2 rounded-xl bg-ph px-3 py-2 text-sm text-ink2">
                  {r.detail}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                {/* La conversación entera, para poder juzgar con lo que se dijo y
                    no solo con lo que resume quien reporta. */}
                <Link
                  href={`/admin/conversaciones/${r.conversation_id}`}
                  className="text-brand underline"
                >
                  Leer la conversación
                </Link>
                <Link
                  href={`/admin/usuarios?q=${encodeURIComponent(r.reported_alias)}`}
                  className="text-brand underline"
                >
                  Ver a {r.reported_alias}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
