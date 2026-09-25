import { notFound } from "next/navigation";
import Link from "next/link";
import { currentAdmin } from "@/lib/session";
import { query } from "@/lib/db";
import { ReviewForm } from "@/features/moderation/Forms";
import { AppHeader } from "@/components/AppHeader";
import { countOpenChatReports } from "@/features/chat/queries";
import { formatCop } from "@/lib/money";
import { Volver } from "@/components/Volver";
import { confirmarNit } from "@/features/sellers/admin";

// Pantalla 1m del mockup, en su versión mínima: la cola de revisión y los
// reportes. El panel completo (verificaciones, disputas, usuarios) llega después.
export const dynamic = "force-dynamic";

type Pending = {
  id: string;
  title: string;
  price_cop: number;
  category_label: string;
  imei: string | null;
  seller_alias: string;
  reports: number;
  reasons: string | null;
};

export default async function Admin() {
  // Sin panel para quien no es administrador, y sin pista de que exista.
  const admin = await currentAdmin();
  if (!admin) notFound();

  const pending = await query<Pending>(
    `select l.id, l.title, l.price_cop, c.label as category_label, l.imei,
            coalesce(u.alias, u.name) as seller_alias,
            (select count(*)::int from reports r
              where r.listing_id = l.id and r.resolved_at is null) as reports,
            (select string_agg(distinct r.reason, ', ') from reports r
              where r.listing_id = l.id and r.resolved_at is null) as reasons
       from listings l
       join "user" u on u.id = l.seller_id
       join categories c on c.slug = l.category
      where l.status = 'en_revision'
         or exists (select 1 from reports r
                     where r.listing_id = l.id and r.resolved_at is null)
      order by l.created_at`,
  );

  const chatsReportados = await countOpenChatReports();
  // Corrección 15: empresas con el RUT por revisar.
  const empresas = await query<{
    user_id: string;
    legal_name: string;
    nit: string;
    representante_nombre: string | null;
  }>(
    `select user_id, legal_name, nit, representante_nombre from stores
      where archivada_at is null and nit_confirmado_at is null and rut_pdf is not null
      order by created_at`,
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <div className="mb-4">
          <Volver href="/" />
        </div>
        {/* Envuelve. En 390 px el título y los cuatro enlaces no caben en una
            línea, y como ninguno de los dos contenedores envolvía, la página
            entera se hacía 443 px de ancho y había que arrastrarla de lado para
            leer cualquier cosa (ronda de diseño, Sol, 2026-09-20). */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h1 className="font-title text-2xl font-semibold">Moderación</h1>
          <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href="/admin/disputas" className="text-brand underline">
              Disputas
            </Link>
            {/* Corrección 52 (D-128): categorías, lugares, tallas y palabras. */}
            <Link href="/admin/configuracion" className="text-brand underline">
              Configuración
            </Link>
            <Link href="/admin/conversaciones" className="text-brand underline">
              Chats
              {/* El número solo si hay algo: un cero dibujado es ruido con
                  forma de alerta. */}
              {chatsReportados > 0 && (
                <span
                  data-testid="chats-reportados"
                  className="ml-1 rounded-full bg-accent px-1.5 text-xs font-bold text-on-accent"
                >
                  {chatsReportados}
                </span>
              )}
            </Link>
            <Link href="/admin/usuarios" className="text-brand underline">
              Cuentas
            </Link>
            <Link href="/admin/reportes" className="text-brand underline">
              Reportes
            </Link>
          </span>
        </div>
        <p data-testid="cola" className="mt-1 text-sm text-muted">
          {pending.length === 1
            ? "1 publicación por revisar"
            : `${pending.length} publicaciones por revisar`}
        </p>

        {pending.length === 0 && (
          <p className="mt-6 rounded-2xl bg-white shadow-xs p-6 text-sm ring-1 ring-line">
            Nada pendiente. Aquí caen las publicaciones de electrónica, que
            esperan revisión hasta que se pueda contrastar el IMEI de forma
            automática, y cualquier publicación que alguien reporte.
          </p>
        )}

        <ul className="mt-5 flex flex-col gap-3">
          {pending.map((l) => (
            <li
              key={l.id}
              className="rounded-2xl bg-white shadow-xs p-4 ring-1 ring-line"
            >
              <div className="flex items-baseline justify-between gap-4">
                <Link
                  href={`/producto/${l.id}`}
                  className="font-medium underline"
                >
                  {l.title}
                </Link>
                <span className="shrink-0 text-sm">
                  {formatCop(l.price_cop)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {l.category_label} · {l.seller_alias}
                {l.imei && <> · IMEI {l.imei}</>}
              </p>
              {l.reports > 0 && (
                <p className="mt-1.5 text-sm text-warn">
                  {l.reports === 1 ? "1 reporte" : `${l.reports} reportes`}:{" "}
                  {l.reasons}
                </p>
              )}
              <ReviewForm listingId={l.id} />
            </li>
          ))}
        </ul>
        <section data-testid="empresas-por-confirmar" className="mt-10">
          <h2 className="font-title text-lg font-semibold">Empresas por confirmar</h2>
          <p className="mt-1 text-sm text-muted">
            Revisa que el RUT corresponda al NIT y a la razón social. Al confirmar se
            activan la insignia de empresa y la carga en lote.
          </p>
          {empresas.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No hay empresas esperando.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {empresas.map((e) => (
                <li
                  key={e.user_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 text-sm shadow-xs ring-1 ring-line"
                >
                  <span>
                    <span className="block font-medium">{e.legal_name}</span>
                    <span className="block text-muted">
                      NIT {e.nit}
                      {e.representante_nombre && ` · Representante: ${e.representante_nombre}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <a
                      href={`/admin/rut/${e.user_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand underline"
                    >
                      Ver RUT
                    </a>
                    <form action={confirmarNit}>
                      <input type="hidden" name="userId" value={e.user_id} />
                      <button
                        type="submit"
                        className="rounded-xl bg-brand px-3 py-1.5 text-sm font-medium text-cream"
                      >
                        Confirmar NIT
                      </button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
