import Link from "next/link";
import { redirect } from "next/navigation";
import { activeUser } from "@/lib/session";
import { getVerification } from "@/features/kyc/queries";
import { beginVerification } from "@/features/kyc/actions";
import { AppHeader } from "@/components/AppHeader";
import { Button, ButtonLink } from "@/components/ui";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { listSellerMetrics } from "@/features/metrics/queries";

// Pantalla 1c del mockup. D-02: el vendedor verifica identidad al crear la cuenta,
// antes de publicar, no antes de cobrar.
export const dynamic = "force-dynamic";

export default async function Vender() {
  // Una cuenta suspendida no llega a las pantallas que escriben.
  const user = await activeUser();
  // D-01: sin celular confirmado no se entra al circuito de vendedor.
  if (!user.phoneNumberVerified) redirect("/verificar");

  const v = await getVerification(user.id);
  const aprobado = v?.status === "aprobado";
  // Las cifras de la portada del panel salen de las mismas publicaciones que se
  // gestionan un clic más adentro: no hay una segunda fuente que pueda mentir.
  const metrics = aprobado ? await listSellerMetrics(user.id) : [];
  const activas = metrics.filter((m) => m.status === "activa").length;
  const vistas = metrics.reduce((t, m) => t + m.views, 0);

  return (
    <>
      <AppHeader />
      <main className={`mx-auto px-5 py-8 ${aprobado ? "max-w-5xl" : "max-w-md"}`}>
        {aprobado ? (
          <>
            <div className="rounded-3xl bg-brand px-6 py-7 text-cream sm:px-8">
              <h1 className="font-title text-2xl font-semibold sm:text-3xl">
                Tu espacio de vendedor
              </h1>
              <p className="mt-3">
                <VerifiedBadge label="Identidad verificada" />
              </p>
              <p className="mt-3 max-w-xl text-sm text-cream/85">
                Tu perfil muestra el distintivo de identidad verificada, que es lo que
                hace que un comprador se anime a pagarle a alguien que no conoce.
              </p>

              {metrics.length > 0 && (
                <dl className="mt-6 flex gap-8 border-t border-cream/20 pt-5">
                  <div>
                    <dt className="text-xs text-cream/70">Publicaciones activas</dt>
                    <dd className="font-title text-2xl font-semibold tabular-nums">
                      {activas}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-cream/70">Visitas en total</dt>
                    <dd className="font-title text-2xl font-semibold tabular-nums">
                      {vistas}
                    </dd>
                  </div>
                </dl>
              )}
            </div>

            {/* Antes esta pantalla decía «ya puedes publicar» y el único enlace
                llevaba al catálogo: quien llegaba aquí a vender se quedaba sin
                salida, y sus publicaciones no se podían encontrar desde ninguna
                parte de la interfaz. */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Atajo
                href="/publicar"
                titulo="Publicar un artículo"
                texto="Fotos, precio y el video que prueba que existe."
                accion="Empezar"
                principal
              />
              <Atajo
                href="/vender/metricas"
                titulo="Tus publicaciones"
                texto="Ver visitas, corregir el precio, reservar o retirar."
                accion={metrics.length > 0 ? `Gestionar las ${metrics.length}` : "Ver"}
              />
              <Atajo
                href="/actividad"
                titulo="Ventas y conversaciones"
                texto="Quién te escribió, qué te ofrecieron, qué hay que despachar."
                accion="Abrir"
              />
            </div>

            <p className="mt-7 text-sm text-muted">
              ¿Vendes con frecuencia?{" "}
              <Link href="/tienda" className="text-brand underline">
                Registra tu tienda con NIT
              </Link>{" "}
              y publica varios artículos de una vez.
            </p>
          </>
        ) : v?.status === "pendiente" ? (
          <>
            <h1 className="font-title text-2xl font-semibold">Estamos revisando</h1>
            {/* El estado intermedio tiene que ser visible: estos procesos tardan y
                una pantalla muda se lee como una falla. */}
            <p className="mt-2 text-ink2">
              Tu verificación está en curso. Suele tardar unos minutos y te avisamos
              apenas haya respuesta. Puedes seguir explorando mientras tanto.
            </p>
            <p className="mt-4 text-sm text-muted">
              Referencia <code>{v.reference}</code>
            </p>
          </>
        ) : (
          <>
            <h1 className="font-title text-2xl font-semibold">
              Verifica tu identidad para vender
            </h1>
            <p className="mt-2 text-ink2">
              Los vendedores se verifican antes de publicar. Es lo que separa a
              2venta de un grupo de compraventa cualquiera.
            </p>

            {v?.status === "rechazado" && (
              <div
                role="alert"
                className="mt-5 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger"
              >
                <p className="font-medium">No pudimos verificarte</p>
                {/* Un rechazo sin salida convierte a un usuario legítimo en un
                    ticket de soporte: siempre hay motivo y siempre hay reintento. */}
                <p className="mt-1">{v.reason ?? "El proveedor no dio un motivo."}</p>
              </div>
            )}

            <ol className="mt-6 flex flex-col gap-3 text-sm text-ink2">
              <li>1. Foto de tu cédula por ambos lados, sin reflejos.</li>
              <li>2. Una selfie para confirmar que eres tú.</li>
              <li>3. Listo. Nosotros no guardamos ni la cédula ni la selfie.</li>
            </ol>

            <form action={beginVerification} className="mt-7">
              <Button type="submit">
                {v?.status === "rechazado" ? "Volver a intentar" : "Empezar verificación"}
              </Button>
            </form>
          </>
        )}
      </main>
    </>
  );
}

function Atajo({
  href,
  titulo,
  texto,
  accion,
  principal = false,
}: {
  href: string;
  titulo: string;
  texto: string;
  accion: string;
  principal?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-line">
      <h2 className="font-title font-semibold">{titulo}</h2>
      <p className="mt-1 flex-1 text-sm text-ink2">{texto}</p>
      <div className="mt-4">
        {/* El nombre accesible es el título, no el verbo: un lector de pantalla que
            recorre los enlaces de la página leería tres veces «Ver» y no sabría a
            dónde va ninguno. */}
        <ButtonLink
          href={href}
          aria-label={titulo}
          variant={principal ? "primary" : "outline"}
        >
          {accion}
        </ButtonLink>
      </div>
    </div>
  );
}
