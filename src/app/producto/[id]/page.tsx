import { notFound } from "next/navigation";
import { mediaUrl } from "@/lib/media";
import Link from "next/link";
import { getListing } from "@/features/catalog/queries";
import { CONDITION_LABEL } from "@/features/catalog/labels";
import { formatCop } from "@/lib/money";
import { commissionCop, sellerPayoutCop } from "@/features/payments/money";
import { AppHeader } from "@/components/AppHeader";
import { Price } from "@/components/Price";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { BuyButton } from "@/features/payments/BuyButton";
import { findOwnPendingOrder } from "@/features/payments/abandon";
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
import { Avatar } from "@/components/Avatar";
import { getReputation } from "@/features/ratings/queries";

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
  if (
    !publicStatuses.includes(listing.status) &&
    !isSeller &&
    user?.role !== "admin"
  ) {
    notFound();
  }

  const questions = await listQuestions(listing.id);
  const promotion = isSeller ? await getActivePromotion(listing.id) : null;
  // La reputación va donde se decide la compra, no solo en el perfil: el mockup 1f
  // la pone junto al vendedor y era de lo poco que faltaba de esa pantalla.
  const reputation = await getReputation(listing.seller_id);

  // Si está reservado, puede estarlo por un pago sin terminar de quien está mirando.
  // Decirle a esa persona que el artículo «está reservado para otra persona» era
  // mentira y la dejaba sin salida: ni comprar, ni soltar lo que ella misma apartó
  // (ronda de usuario, 2026-09-14).
  const pedidoPropio =
    user && !isSeller && listing.status === "reservada"
      ? await findOwnPendingOrder(user.id, [listing.id])
      : null;
  // S-15: no cuenta las vistas del propio vendedor, que si no vería su publicación
  // llena de visitas suyas y creería que interesa.
  await recordView(listing.id, user?.id ?? null, listing.seller_id);
  const favorited = user ? await isFavorite(user.id, listing.id) : false;
  const inCart = user ? await isInCart(user.id, listing.id) : false;
  const photos = await listPhotos(listing.id);

  return (
    <>
      <AppHeader zone={listing.seller_zone} />
      <main className="mx-auto max-w-6xl px-5 py-6">
        <Link href="/" className="text-sm text-ink2 underline">
          Volver
        </Link>

        {/* En escritorio, el medio a la izquierda y la decisión de compra a la
            derecha: antes todo iba apilado en una columna estrecha y el botón de
            comprar quedaba fuera de la pantalla. */}
        <div className="mt-4 gap-8 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,1fr)] lg:items-start">
          <div>
            {/* D-14: el video es la prueba de que el artículo existe y está como
                dice. Va primero, antes que cualquier otra cosa: las fotos son
                presentación, el video es la garantía. */}
            <div className="relative">
              <video
                data-testid="video-articulo"
                className="aspect-[4/3] w-full rounded-2xl bg-ph object-cover"
                controls
                playsInline
                preload="metadata"
                poster={mediaUrl(listing.poster_path)}
                src={mediaUrl(listing.video_path)}
              />
              <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium text-cream backdrop-blur-sm">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-3 w-3 fill-current"
                >
                  <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
                </svg>
                Grabado por el vendedor
              </span>
            </div>

            {photos.length > 0 && (
              <ul
                data-testid="fotos"
                className="mt-3 flex gap-2 overflow-x-auto pb-1"
              >
                {photos.map((p) => (
                  <li key={p.id} className="shrink-0">
                    <img
                      src={mediaUrl(p.path)}
                      alt=""
                      className="h-28 w-28 rounded-xl bg-ph object-cover sm:h-32 sm:w-32"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 lg:mt-0">
            <Price cop={listing.price_cop} size="lg" />
            <h1 className="mt-1 text-lg font-medium">{listing.title}</h1>

            {/* Los atributos eran una lista de etiqueta y valor que se leía como
                una ficha técnica. Como distintivos se leen de un vistazo, que es lo
                que hace alguien decidiendo si comprar (mockup 1f). */}
            <ul data-testid="atributos" className="mt-4 flex flex-wrap gap-2">
              <Atributo>{CONDITION_LABEL[listing.condition]}</Atributo>
              <Atributo>{listing.category_label}</Atributo>
              {listing.has_imei && (
                // Se le pide al vendedor, se valida con dígito de verificación y se
                // guarda desde la primera rebanada; al comprador, que es a quien le
                // sirve, no se le decía. Nunca el número: eso identifica el equipo.
                <Atributo destacado>IMEI validado</Atributo>
              )}
            </ul>

            <p className="mt-5 text-sm leading-relaxed text-ink2">
              {listing.description}
            </p>

            {/* D-04: alias y zona. Nunca nombre completo ni dirección exacta. */}
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
              <Avatar
                src={listing.seller_avatar_path ? mediaUrl(listing.seller_avatar_path) : null}
                name={listing.seller_alias}
              />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2">
                  <Link
                    href={`/vendedor/${listing.seller_id}`}
                    className="font-medium hover:underline"
                  >
                    {listing.seller_alias}
                  </Link>
                  {listing.seller_verified && <VerifiedBadge />}
                </p>
                {/* D-17: un vendedor sin ventas no muestra cifras en cero. «0 ventas,
                    0% disputas» se lee como mal desempeño cuando solo significa que
                    es nuevo, y al arrancar la plataforma lo son todos. */}
                {reputation.sales > 0 ? (
                  <p data-testid="reputacion-ficha" className="mt-0.5 text-sm text-muted">
                    {reputation.average !== null && (
                      <span className="font-medium text-ink">
                        {reputation.average.toLocaleString("es-CO")} ★{" "}
                      </span>
                    )}
                    {reputation.sales} {reputation.sales === 1 ? "venta" : "ventas"}
                    {reputation.disputeRate !== null &&
                      ` · ${reputation.disputeRate.toLocaleString("es-CO")}% disputas`}
                    {" · "}
                    {listing.seller_zone}
                  </p>
                ) : (
                  <p data-testid="vendedor-nuevo" className="mt-0.5 text-sm text-muted">
                    {listing.seller_verified
                      ? `Primera venta en 2venta · identidad verificada · ${listing.seller_zone}`
                      : `Primera venta en 2venta · ${listing.seller_zone}`}
                  </p>
                )}
              </div>
              <Link
                href={`/vendedor/${listing.seller_id}`}
                className="shrink-0 text-sm text-brand underline"
              >
                Ver perfil
              </Link>
            </div>

            {/* El pago protegido es, con el video, la razón de existir del
                producto. Tenía la misma tarjeta blanca que las preguntas de más
                abajo: se leía como una caja de ayuda. Ahora lleva el verde de
                marca y es el punto focal de la columna de compra. */}
            <div className="mt-6 overflow-hidden rounded-2xl shadow-sm">
              <div className="flex items-start gap-3 bg-brand p-5 text-cream">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-7 w-7 shrink-0 text-accent"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8.5 12.2l2.3 2.3 4.7-4.7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>
                  <span className="block font-title text-lg font-semibold">
                    Pago protegido
                  </span>
                  <span className="mt-1 block text-sm text-cream/85">
                    Guardamos tu plata hasta que confirmes que recibiste el
                    producto.
                  </span>
                </span>
              </div>

              <div className="bg-white p-4 text-sm">
                {isSeller ? (
                  // El dueño no compra lo suyo. Antes veía el botón, llenaba la
                  // dirección entera y solo al confirmar le decían que no podía
                  // (hallazgo de la ronda de agentes, 2026-09-13).
                  <p
                    role="status"
                    className="rounded-xl bg-ph px-4 py-3 text-sm text-ink2"
                  >
                    Esta es tu publicación. Así la ve un comprador.
                  </p>
                ) : listing.status === "activa" ? (
                  <BuyButton listingId={listing.id} signedIn={Boolean(user)} />
                ) : pedidoPropio ? (
                  <div className="rounded-xl bg-warn/10 px-4 py-3 text-sm">
                    <p className="font-medium text-warn">
                      Lo tienes apartado con un pago sin terminar
                    </p>
                    <p className="mt-1 text-ink2">
                      Nadie más puede comprarlo mientras tanto. Termina el pago o
                      suéltalo desde tu pedido.
                    </p>
                    <p className="mt-2">
                      <Link href={`/pedido/${pedidoPropio}`} className="text-brand underline">
                        Ir a tu pedido
                      </Link>
                    </p>
                  </div>
                ) : (
                  // Vendida o reservada: la ficha se ve (el enlace pudo compartirse),
                  // pero no se invita a comprar lo que ya no está (hallazgo de QA).
                  <p
                    role="status"
                    className="mt-4 rounded-xl bg-ph px-4 py-3 text-sm text-ink2"
                  >
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
            </div>
          </div>
        </div>

        {/* D-21: preguntas públicas. Una pregunta respondida le ahorra la misma
            duda al siguiente comprador, cosa que el chat privado no hace. */}
        <section className="mt-8 max-w-3xl">
          <h2 className="font-title text-lg font-semibold">Preguntas</h2>
          {questions.length === 0 && (
            <p className="mt-2 text-sm text-muted">
              Todavía nadie ha preguntado nada.
            </p>
          )}
          <ul className="mt-3 flex flex-col gap-4">
            {questions.map((q) => (
              <li key={q.id} className="rounded-2xl bg-white p-4 text-sm">
                <p className="font-medium">{q.body}</p>
                <p className="mt-0.5 text-xs text-muted">{q.asker_alias}</p>
                {q.answer ? (
                  <p className="mt-2 border-l-2 border-brand/30 pl-3 text-ink2">
                    {q.answer}
                  </p>
                ) : isSeller ? (
                  <AnswerForm questionId={q.id} />
                ) : (
                  <p className="mt-2 text-xs text-muted">
                    Sin responder todavía.
                  </p>
                )}
              </li>
            ))}
          </ul>
          {user && !isSeller && <AskForm listingId={listing.id} />}
        </section>

        {/* RF-32 y D-16: la moderación automática filtra lo evidente; esto es lo
            que trae a revisión lo que se le escapó. */}
        {user && !isSeller && <ReportForm listingId={listing.id} />}

        {isSeller &&
          ["activa", "reservada", "en_revision"].includes(listing.status) && (
            <section className="mt-8 rounded-2xl bg-white p-4 text-sm">
              <h2 className="font-medium">Tu publicación</h2>
              {/* Lo que más le importa al vendedor y nadie le decía (hallazgo de
                QA, 2026-09-13): cuánto le queda después de la comisión. */}
              <p className="mt-1 text-muted">
                Si se vende por {formatCop(listing.price_cop)}, te llegan{" "}
                <b className="text-ink">
                  {formatCop(sellerPayoutCop(listing.price_cop))}
                </b>{" "}
                después de la comisión de 2venta (
                {formatCop(commissionCop(listing.price_cop))}).
              </p>

              {/* RF-16 y RF-17. Sin esto, un error de dedo en el precio se queda para
                siempre y un artículo vendido por fuera sigue apareciendo. */}
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href={`/producto/${listing.id}/editar`}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-brand/25 bg-white px-4 py-3 text-sm font-medium hover:bg-ph"
                >
                  Editar
                </Link>
                {listing.status === "activa" && (
                  <StatusButton listingId={listing.id} status="reservada" />
                )}
                {listing.status === "reservada" && (
                  <StatusButton listingId={listing.id} status="activa" />
                )}
                <StatusButton listingId={listing.id} status="vendida" />
                <StatusButton
                  listingId={listing.id}
                  status="retirada"
                  variant="ghost"
                />
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
              <PromoteButton
                listingId={listing.id}
                extending={Boolean(promotion)}
              />
            </section>
          )}
      </main>
    </>
  );
}

/** Un dato del artículo, legible de un vistazo. El destacado es para lo que prueba
 *  algo comprobado por 2venta y no declarado por el vendedor. */
function Atributo({
  children,
  destacado = false,
}: {
  children: React.ReactNode;
  destacado?: boolean;
}) {
  return (
    <li
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        destacado ? "bg-brand/10 text-brand ring-1 ring-brand/20" : "bg-ph text-ink2"
      }`}
    >
      {children}
    </li>
  );
}
