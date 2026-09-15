import { notFound } from "next/navigation";
import Link from "next/link";
import { currentAdmin } from "@/lib/session";
import { query } from "@/lib/db";
import { ReviewForm } from "@/features/moderation/Forms";
import { AppHeader } from "@/components/AppHeader";
import { formatCop } from "@/lib/money";

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

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="font-title text-2xl font-semibold">Moderación</h1>
          <span className="flex gap-4 text-sm">
            <Link href="/admin/disputas" className="text-brand underline">
              Disputas
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
      </main>
    </>
  );
}
