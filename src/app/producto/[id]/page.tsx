import { notFound } from "next/navigation";
import Link from "next/link";
import { getListing } from "@/features/catalog/queries";
import { CONDITION_LABEL } from "@/features/catalog/labels";
import { formatCop } from "@/lib/money";
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

  const questions = await listQuestions(listing.id);
  const isSeller = user?.id === listing.seller_id;
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
                <img src={`/api/media/${p.path}`} alt=""
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
          poster={`/api/media/${listing.poster_path}`}
          src={`/api/media/${listing.video_path}`}
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
          <BuyButton listingId={listing.id} />
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
