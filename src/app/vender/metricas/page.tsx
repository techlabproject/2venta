import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { listSellerMetrics } from "@/features/metrics/queries";
import { AppHeader } from "@/components/AppHeader";

// D-24: métricas del vendedor. Vistas, favoritos y conversaciones por publicación.
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  activa: "Activa",
  en_revision: "En revisión",
  rechazada: "Rechazada",
  reservada: "Reservada",
  vendida: "Vendida",
};

export default async function Metricas() {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const metrics = await listSellerMetrics(user.id);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <h1 className="font-title text-2xl font-semibold">Tus publicaciones</h1>

        {metrics.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-ink2">
            Todavía no has publicado nada.
          </p>
        ) : (
          <ul data-testid="metricas" className="mt-5 flex flex-col gap-3">
            {metrics.map((m) => (
              <li key={m.listing_id} className="rounded-2xl bg-white p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <Link href={`/producto/${m.listing_id}`} className="font-medium underline">
                    {m.title}
                  </Link>
                  <span className="shrink-0 text-xs text-muted">
                    {STATUS_LABEL[m.status] ?? m.status}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <dt className="text-xs text-muted">Vistas</dt>
                    <dd data-testid={`vistas-${m.listing_id}`} className="font-title text-lg font-semibold">
                      {m.views}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Favoritos</dt>
                    <dd className="font-title text-lg font-semibold">{m.favorites}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Conversaciones</dt>
                    {/* La cifra era un número muerto: quien veía «3» no tenía
                        cómo llegar a esas tres conversaciones. */}
                    <dd className="font-title text-lg font-semibold">
                      {m.messages > 0 ? (
                        <Link href="/actividad" className="underline">
                          {m.messages}
                        </Link>
                      ) : (
                        m.messages
                      )}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
