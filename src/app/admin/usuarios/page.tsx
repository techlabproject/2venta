import { notFound } from "next/navigation";
import Link from "next/link";
import { currentAdmin } from "@/lib/session";
import { query } from "@/lib/db";
import { SuspendForm } from "@/features/moderation/SuspendForm";
import { AppHeader } from "@/components/AppHeader";

// RF-41. Cuentas reportadas y suspensión.
export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  estafa: "intento de estafa",
  fuera_app: "insiste en pagar por fuera",
  acoso: "trato o acoso",
  suplantacion: "suplantación",
  otro: "otro",
};

export default async function Usuarios() {
  const admin = await currentAdmin();
  if (!admin) notFound();

  const reported = await query<{
    id: string;
    alias: string;
    suspended_at: Date | null;
    reports: number;
    reasons: string;
  }>(
    // Se incluyen las cuentas suspendidas hace poco. Suspender resuelve sus
    // reportes, así que si solo se mostraran los pendientes la fila desaparecería
    // al apretar el botón, sin ninguna confirmación de que pasó algo.
    `select u.id, coalesce(u.alias, u.name) as alias, u.suspended_at,
            count(r.id) filter (where r.resolved_at is null)::int as reports,
            coalesce(
              string_agg(distinct r.reason, ',') filter (where r.resolved_at is null),
              ''
            ) as reasons
       from user_reports r join "user" u on u.id = r.reported_id
      where r.resolved_at is null
         or u.suspended_at > now() - interval '7 days'
      group by u.id, u.alias, u.name, u.suspended_at
      order by u.suspended_at nulls first, count(r.id) desc`
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <Link href="/admin" className="text-sm text-ink2 underline">
          Moderación
        </Link>
        <h1 className="mt-4 font-title text-2xl font-semibold">Cuentas reportadas</h1>
        <p data-testid="cola-usuarios" className="mt-1 text-sm text-muted">
          {reported.length === 1
            ? "1 cuenta por revisar"
            : `${reported.length} cuentas por revisar`}
        </p>

        {reported.length === 0 && (
          <p className="mt-6 rounded-2xl bg-white p-6 text-sm">
            Nada pendiente. Suspender una cuenta no borra sus pedidos ni sus
            conversaciones: al otro lado de cada pedido hay alguien que no hizo nada
            malo.
          </p>
        )}

        <ul className="mt-5 flex flex-col gap-3">
          {reported.map((u) => (
            <li key={u.id} className="rounded-2xl bg-white p-4 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <Link href={`/vendedor/${u.id}`} className="font-medium underline">
                  {u.alias}
                </Link>
                {u.reports > 0 && (
                  <span className="shrink-0 text-warn">
                    {u.reports === 1 ? "1 reporte" : `${u.reports} reportes`}
                  </span>
                )}
              </div>
              {u.reasons && (
                <p className="mt-1 text-muted">
                  {u.reasons
                    .split(",")
                    .map((r) => REASON_LABEL[r] ?? r)
                    .join(", ")}
                </p>
              )}
              {u.suspended_at ? (
                <p className="mt-3 font-medium text-danger">Cuenta suspendida</p>
              ) : (
                <SuspendForm userId={u.id} />
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
