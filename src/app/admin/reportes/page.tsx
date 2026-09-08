import { notFound } from "next/navigation";
import Link from "next/link";
import { currentAdmin } from "@/lib/session";
import { businessReport, parsePeriod } from "@/features/reports/queries";
import { AppHeader } from "@/components/AppHeader";
import { formatCop } from "@/lib/money";

// RF-42. El último requisito funcional que quedaba.
export const dynamic = "force-dynamic";

const dia = (d: Date) => d.toISOString().slice(0, 10);

export default async function Reportes({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}) {
  const admin = await currentAdmin();
  if (!admin) notFound();

  const raw = await searchParams;
  const params = new URLSearchParams();
  if (raw.desde) params.set("desde", raw.desde);
  if (raw.hasta) params.set("hasta", raw.hasta);

  const period = parsePeriod(params);
  const report = await businessReport(period);

  // El objetivo escrito es menos del 5%.
  const disputaAlta = report.disputeRate !== null && report.disputeRate >= 5;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <Link href="/admin" className="text-sm text-ink2 underline">
          Moderación
        </Link>
        <h1 className="mt-4 font-title text-2xl font-semibold">Reportes</h1>

        <form action="/admin/reportes" method="get" className="mt-5 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Desde
            <input type="date" name="desde" defaultValue={dia(period.from)}
              className="rounded-xl border border-brand/20 bg-white px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Hasta
            <input type="date" name="hasta" defaultValue={dia(period.to)}
              className="rounded-xl border border-brand/20 bg-white px-3 py-2" />
          </label>
          <button type="submit" className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-cream">
            Ver
          </button>
          <a href={`/api/admin/reportes.csv?${params.toString()}`}
            className="rounded-xl border border-brand/25 bg-white px-4 py-2 text-sm font-medium">
            Descargar
          </a>
        </form>

        {/* La tasa de disputa va sola y destacada: de todas las cifras es la única
            que dice si el producto está funcionando. Si sube, la verificación
            previa no está sirviendo, y esa es la apuesta entera del negocio. */}
        <section
          className={`mt-7 rounded-2xl p-5 ${disputaAlta ? "bg-danger/10" : "bg-brand/10"}`}
        >
          <p className="text-sm text-muted">Tasa de disputa</p>
          <p
            data-testid="tasa-disputa"
            className={`font-title text-4xl font-semibold ${disputaAlta ? "text-danger" : "text-brand"}`}
          >
            {report.disputeRate === null
              ? "Sin ventas"
              : `${report.disputeRate.toString().replace(".", ",")}%`}
          </p>
          <p className="mt-1 text-sm text-ink2">
            El objetivo es menos del 5%.{" "}
            {disputaAlta
              ? "Por encima significa que la verificación previa no está sirviendo."
              : "Dentro del objetivo."}
          </p>
        </section>

        <dl data-testid="cifras" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Cifra label="Ventas" value={String(report.sales)} />
          <Cifra label="Volumen" value={formatCop(report.gmvCop)} />
          <Cifra label="Comisiones" value={formatCop(report.commissionCop)} />
          <Cifra label="Ticket promedio" value={formatCop(report.averageTicketCop)} />
        </dl>

        <h2 className="mt-8 font-title text-lg font-semibold">Por categoría</h2>
        {report.byCategory.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Sin ventas completadas en este periodo.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="pb-2">Categoría</th>
                  <th className="pb-2 text-right">Ventas</th>
                  <th className="pb-2 text-right">Volumen</th>
                  <th className="pb-2 text-right">Comisiones</th>
                </tr>
              </thead>
              <tbody>
                {report.byCategory.map((c) => (
                  <tr key={c.label} className="border-b border-line">
                    <td className="py-2">{c.label}</td>
                    <td className="py-2 text-right">{c.sales}</td>
                    <td className="py-2 text-right">{formatCop(c.gmvCop)}</td>
                    <td className="py-2 text-right">{formatCop(c.commissionCop)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

function Cifra({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-title text-xl font-semibold">{value}</dd>
    </div>
  );
}
