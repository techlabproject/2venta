import { notFound } from "next/navigation";
import { mediaUrl } from "@/lib/media";
import { currentAdmin } from "@/lib/session";
import { KIND_LABEL, listOpenClaims } from "@/features/claims/queries";
import { ResolveClaimForm } from "@/features/claims/Forms";
import { AppHeader } from "@/components/AppHeader";
import { formatCop } from "@/lib/money";
import { Volver } from "@/components/Volver";
import { Pruebas } from "@/components/Pruebas";

// El panel de arbitraje de la D-13. Sin esto, "2venta arbitra con la evidencia de
// ambas partes" es una promesa que nadie puede cumplir.
export const dynamic = "force-dynamic";

export default async function Disputas() {
  const admin = await currentAdmin();
  if (!admin) notFound();

  const claims = await listOpenClaims();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <Volver href="/admin">Moderación</Volver>
        <h1 className="mt-4 font-title text-2xl font-semibold">Disputas</h1>
        <p data-testid="cola-disputas" className="mt-1 text-sm text-muted">
          {claims.length === 1
            ? "1 reclamo abierto"
            : `${claims.length} reclamos abiertos`}
        </p>

        {claims.length === 0 && (
          <p className="mt-6 rounded-2xl bg-white shadow-xs p-6 text-sm ring-1 ring-line">
            Nada pendiente. Aquí llegan los reclamos con el dinero congelado,
            hasta que alguien compare las dos versiones contra el video de la
            publicación.
          </p>
        )}

        <ul className="mt-5 flex flex-col gap-4">
          {claims.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl bg-white shadow-xs p-4 ring-1 ring-line"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-medium">{c.listing_title}</h2>
                <span className="shrink-0 text-sm">
                  {formatCop(c.subtotal_cop)}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-warn">{KIND_LABEL[c.kind]}</p>

              {/* El video de la publicación es la prueba contra la que se compara
                  (D-13), así que va aquí y no a un clic de distancia. */}
              <video
                className="mt-3 aspect-[4/3] w-full rounded-xl bg-ph object-cover"
                controls
                preload="metadata"
                src={mediaUrl(c.video_path)}
              />

              <div className="mt-4 flex flex-col gap-3 text-sm">
                <div>
                  <p className="font-medium">Dice {c.buyer_alias} (compró)</p>
                  <p className="mt-1 text-ink2">{c.detail}</p>
                  {/* `opened_by` es siempre quien compró: solo el comprador abre
                      un reclamo. Lo demás que haya en las pruebas es del vendedor,
                      que solo puede aportarlas al responder (S-39). */}
                  <Pruebas
                    fotos={c.photos.filter((f) => f.uploaded_by === c.opened_by)}
                    de="quien compró"
                  />
                </div>
                <div>
                  <p className="font-medium">Dice {c.seller_alias} (vendió)</p>
                  <p className="mt-1 text-ink2">
                    {c.seller_reply ?? (
                      <span className="text-muted">
                        Todavía no ha respondido.
                      </span>
                    )}
                  </p>
                  <Pruebas
                    fotos={c.photos.filter((f) => f.uploaded_by !== c.opened_by)}
                    de="quien vendió"
                  />
                </div>
              </div>

              <ResolveClaimForm orderId={c.order_id} />
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
