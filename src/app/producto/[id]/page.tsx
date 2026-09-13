import { notFound } from "next/navigation";
import { mediaUrl } from "@/lib/media";
import Link from "next/link";
import { getListing } from "@/features/catalog/queries";
import { CONDITION_LABEL } from "@/features/catalog/labels";
import { formatCop } from "@/lib/money";
import { commissionCop, sellerPayoutCop } from "@/features/payments/money";
import { AppHeader } from "@/components/AppHeader";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { BuyButton } from "@/features/payments/BuyButton";
import { AskForm, AnswerForm, ChatButton } from "@/features/chat/QuestionForms";
import { listQuestions } from "@/features/chat/queries";
import { ReportForm } from "@/features/moderation/Forms";
import { PromoteButton } from "@/features/promotions/PromoteButton";
import { StatusButton } from "@/features/publish/EditForms";
import { getActivePromotion } from "@/features/promotions/queries";
import { recordView } from "@/features/metrics/queries";
import { FavoriteButton } from "@/features/favorites/FavoriteButton";
import { isFavorite } from "@/features/favorites/queries";
import { AddToCartButton } from "@/features/cart/Forms";
import { isInCart } from "@/features/cart/queries";
import { listPhotos } from "@/features/publish/photo-queries";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [listing, user] = await Promise.all([getListing(id), currentUser()]);

  // Un id inexistente o con formato inválido termina en 404, no en una
  // excepción ni en una pantalla en blanco.
  if (!listing) notFound();

  const isSeller = user?.id === listing.seller_id;
  // Lo que nunca pasó por la garantía del video o ya no se ofrece no tiene ficha
  // pública: un borrador de carga en lote, algo en revisión o rechazado, o algo
  // retirado, solo lo ve su dueño o un administrador (hallazgo de QA,
  // 2026-09-13). Vendida y reservada sí se ven: son historia real y el enlace
  // pudo compartirse.
  const publicStatuses = ["activa", "reservada", "vendida"];
  if (!publicStatuses.includes(listing.status) && !isSeller && user?.role !== "admin") {
    notFound();
  }

  const questions = await listQuestions(listing.id);
  const promotion = isSeller ? await getActivePromotion(listing.id) : null;
  // S-15: no cuenta las vistas del propio vendedor, que si no vería su publicación
  // llena de visitas suyas y creería que interesa.
  await recordView(listing.id, user?.id ?? null, listing.seller_id);
  const favorited = user ? await isFavorite(user.id, listing.id) : false;
  const inCart = user ? await isInCart(user.id, listing.id) : false;
  const photos = await listPhotos(listing.id);

  return (
    <>
      <AppHeader zone={listing.seller_zone} />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <Link href="/" className="text-sm text-ink2 underline">
          Volver
        </Link>

        {/* D-14: el video es la prueba de que el artículo existe y está como
            dice. Va primero, antes que cualquier otra cosa. */}
        {photos.length > 0 && (
          // Las fotos van después del video a propósito: el video es la prueba, y
          // lo que da la confianza va primero.
          <ul data-testid="fotos" className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {photos.map((p) => (
              <li key={p.id} className="shrink-0">
                <img src={mediaUrl(p.path)} alt=""
                  className="h-40 w-40 rounded-xl bg-ph object-cover" />
              </li>
            ))}
          </ul>
        )}

        <video
          data-testid="video-articulo"
          className="mt-4 aspect-[4/3] w-full rounded-2xl bg-ph object-cover"
          controls
          playsInline
          preload="metadata"
          poster={mediaUrl(listing.poster_path)}
          src={mediaUrl(listing.video_path)}
        />

        <p className="mt-5 font-title text-3xl font-semibold">
          {formatCop(listing.price_cop)}
        </p>
        <h1 className="mt-1 text-lg font-medium">{listing.title}</h1>

        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">Categoría</dt>
          <dd>{listing.category_label}</dd>
          <dt className="text-muted">Estado</dt>
          <dd>{CONDITION_LABEL[listing.condition]}</dd>
          <dt className="text-muted">Vendedor</dt>
          {/* D-04: alias y zona. Nunca nombre completo ni dirección exacta. */}
          <dd className="flex flex-wrap items-center gap-x-2">
            <Link href={`/vendedor/${listing.seller_id}`} className="underline">
              {listing.seller_alias}
            </Link>
            <span className="text-muted">· {listing.seller_zone}</span>
            {listing.seller_verified && <VerifiedBadge />}
          </dd>
        </dl>

        <p className="mt-5 text-sm leading-relaxed text-ink2">{listing.description}</p>

        <div className="mt-6 rounded-2xl bg-white p-4 text-sm">
          <p className="font-medium">Pago protegido</p>
          <p className="mt-1 text-muted">
            Guardamos tu plata hasta que confirmes que recibiste el producto.
          </p>
          {listing.status === "activa" ? (
            <BuyButton listingId={listing.id} />
          ) : (
            // Vendida o reservada: la ficha se ve (el enlace pudo compartirse),
            // pero no se invita a comprar lo que ya no está (hallazgo de QA).
            <p role="status" className="mt-4 rounded-xl bg-ph px-4 py-3 text-sm text-ink2">
              {listing.status === "vendida"
                ? "Este artículo ya se vendió."
                : listing.status === "reservada"
                  ? "Este artículo está reservado para otra persona."
                  : "Este artículo no está disponible."}
            </p>
          )}
          {user && !isSeller && listing.status === "activa" && (
            <AddToCartButton listingId={listing.id} inCart={inCart} />
          )}
          {!isSeller && <ChatButton listingId={listing.id} />}
          {user && !isSeller && (
            <div className="mt-3">
              <FavoriteButton listingId={listing.id} saved={favorited} />
            </div>
          )}
        </div>

        {/* D-21: preguntas públicas. Una pregunta respondida le ahorra la misma
            duda al siguiente comprador, cosa que el chat privado no hace. */}
        <section className="mt-8">
          <h2 className="font-title text-lg font-semibold">Preguntas</h2>
          {questions.length === 0 && (
            <p className="mt-2 text-sm text-muted">Todavía nadie ha preguntado nada.</p>
          )}
          <ul className="mt-3 flex flex-col gap-4">
            {questions.map((q) => (
              <li key={q.id} className="rounded-2xl bg-white p-4 text-sm">
                <p className="font-medium">{q.body}</p>
                <p className="mt-0.5 text-xs text-muted">{q.asker_alias}</p>
                {q.answer ? (
                  <p className="mt-2 border-l-2 border-brand/30 pl-3 text-ink2">{q.answer}</p>
                ) : isSeller ? (
                  <AnswerForm questionId={q.id} />
                ) : (
                  <p className="mt-2 text-xs text-muted">Sin responder todavía.</p>
                )}
              </li>
            ))}
          </ul>
          {user && !isSeller && <AskForm listingId={listing.id} />}
        </section>

        {/* RF-32 y D-16: la moderación automática filtra lo evidente; esto es lo
            que trae a revisión lo que se le escapó. */}
        {user && !isSeller && <ReportForm listingId={listing.id} />}

        {isSeller && ["activa", "reservada", "en_revision"].includes(listing.status) && (
          <section className="mt-8 rounded-2xl bg-white p-4 text-sm">
            <h2 className="font-medium">Tu publicación</h2>
            {/* Lo que más le importa al vendedor y nadie le decía (hallazgo de
                QA, 2026-09-13): cuánto le queda después de la comisión. */}
            <p className="mt-1 text-muted">
              Si se vende por {formatCop(listing.price_cop)}, te llegan{" "}
              <b className="text-ink">{formatCop(sellerPayoutCop(listing.price_cop))}</b> después
              de la comisión de 2venta ({formatCop(commissionCop(listing.price_cop))}).
            </p>

            {/* RF-16 y RF-17. Sin esto, un error de dedo en el precio se queda para
                siempre y un artículo vendido por fuera sigue apareciendo. */}
            <div className="mt-3 flex flex-col gap-2">
              <Link href={`/producto/${listing.id}/editar`}
                className="inline-flex w-full items-center justify-center rounded-xl border border-brand/25 bg-white px-4 py-3 text-sm font-medium hover:bg-ph">
                Editar
              </Link>
              {listing.status === "activa" && (
                <StatusButton listingId={listing.id} status="reservada" />
              )}
              {listing.status === "reservada" && (
                <StatusButton listingId={listing.id} status="activa" />
              )}
              <StatusButton listingId={listing.id} status="vendida" />
              <StatusButton listingId={listing.id} status="retirada" variant="ghost" />
            </div>

            {promotion && (
              <p className="mt-4 text-muted">
                Destacada hasta el{" "}
                {new Intl.DateTimeFormat("es-CO", {
                  day: "numeric",
                  month: "long",
                  timeZone: "America/Bogota",
                }).format(promotion.ends_at!)}
                .
              </p>
            )}
            {/* Se deja extender mientras está destacada: un vendedor cuyo periodo
                vence mañana quiere renovarlo hoy, no acordarse pasado mañana. El
                periodo nuevo empieza donde termina el anterior, no en paralelo. */}
            <PromoteButton listingId={listing.id} extending={Boolean(promotion)} />
          </section>
        )}
      </main>
    </>
  );
}
