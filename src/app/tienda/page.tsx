import Link from "next/link";
import { redirect } from "next/navigation";
import { activeUser } from "@/lib/session";
import { getVerification } from "@/features/kyc/queries";
import { getStore, listDrafts } from "@/features/store/queries";
import { BulkUploadForm, RegisterStoreForm } from "@/features/store/Forms";
import { AppHeader } from "@/components/AppHeader";
import { formatCop } from "@/lib/money";

// D-07: cuenta de tienda. Es lo que hace viable traer casas de empeño y tiendas
// pequeñas, que era una de las oportunidades que detectó la investigación.
export const dynamic = "force-dynamic";

export default async function Tienda() {
  // Una cuenta suspendida no llega a las pantallas que escriben.
  const user = await activeUser();
  if (!user.phoneNumberVerified) redirect("/verificar");

  const verification = await getVerification(user.id);
  if (verification?.status !== "aprobado") redirect("/vender");

  const store = await getStore(user.id);
  const drafts = store ? await listDrafts(user.id) : [];

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <h1 className="font-title text-2xl font-semibold">
          {store ? store.legal_name : "Registra tu tienda"}
        </h1>

        {store ? (
          <>
            <p className="mt-1 text-sm text-muted">NIT {store.nit}</p>

            <section className="mt-8">
              <h2 className="font-title text-lg font-semibold">Cargar varios artículos</h2>
              {/* La tensión con la D-14: el video no se puede subir desde un
                  archivo, así que el lote crea borradores y el video se graba
                  después, uno por uno. Se ahorra escribir, que es lo que cuesta
                  en volumen, sin tocar la garantía. */}
              <p className="mt-1 text-sm text-ink2">
                Se crean como borradores. El video de cada artículo se graba desde el
                celular: es lo que le permite al comprador ver que existe y en qué
                estado está, y por eso no se puede subir de un archivo.
              </p>
              <BulkUploadForm />
            </section>

            <section className="mt-8">
              <h2 className="font-title text-lg font-semibold">
                {drafts.length === 1
                  ? "1 borrador sin video"
                  : `${drafts.length} borradores sin video`}
              </h2>
              {drafts.length === 0 ? (
                <p className="mt-2 text-sm text-muted">
                  Nada pendiente. Los borradores que cargues aparecen aquí hasta que
                  les grabes el video.
                </p>
              ) : (
                <ul data-testid="borradores" className="mt-3 flex flex-col gap-2">
                  {drafts.map((d) => (
                    <li key={d.id} className="flex items-baseline justify-between gap-3 rounded-2xl bg-white p-4 text-sm">
                      <span>
                        <span className="font-medium">{d.title}</span>
                        <span className="block text-muted">{d.category_label}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span>{formatCop(d.price_cop)}</span>
                        <Link href={`/publicar/${d.id}`} className="text-brand underline">
                          Grabar video
                        </Link>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : (
          <>
            <p className="mt-2 mb-6 text-sm text-ink2">
              Con cuenta de tienda tus publicaciones llevan un distintivo distinto y
              puedes cargar varios artículos de una vez.
            </p>
            <RegisterStoreForm />
          </>
        )}
      </main>
    </>
  );
}
