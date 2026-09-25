import Link from "next/link";
import { redirect } from "next/navigation";
import { clienteActivo } from "@/lib/session";
import { getVerification } from "@/features/kyc/queries";
import { beginVerification } from "@/features/kyc/actions";
import { AppHeader } from "@/components/AppHeader";
import { Button, ButtonLink } from "@/components/ui";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { resumenDelVendedor } from "@/features/metrics/queries";
import { Volver } from "@/components/Volver";
import { rangoDeVisitas } from "@/features/metrics/rangos";
import { getJuridica, getVendedor } from "@/features/sellers/queries";
import { CompletarDatosForm, FormularioVendedor } from "@/features/sellers/Forms";

// Pantalla 1c del mockup. D-02: el vendedor verifica identidad al crear la cuenta,
// antes de publicar, no antes de cobrar.
export const dynamic = "force-dynamic";

export default async function Vender({
  searchParams,
}: {
  searchParams: Promise<{ autorizacion?: string; tipo?: string }>;
}) {
  const sp = await searchParams;
  const faltaAutorizacion = sp.autorizacion === "falta";
  const tipoElegido = sp.tipo === "natural" || sp.tipo === "juridica" ? sp.tipo : null;
  // Una cuenta suspendida no llega a las pantallas que escriben.
  const user = await clienteActivo();
  // D-01: sin celular confirmado no se entra al circuito de vendedor.
  if (!user.phoneNumberVerified) redirect("/verificar");

  const [v, vendedor, juridica] = await Promise.all([
    getVerification(user.id),
    getVendedor(user.id),
    getJuridica(user.id),
  ]);
  const telefonoInicial = user.phoneNumber?.replace(/^\+57/, "") ?? undefined;
  const aprobado = v?.status === "aprobado";
  // Las cifras de la portada del panel salen de las mismas publicaciones que se
  // gestionan un clic más adentro: no hay una segunda fuente que pueda mentir.
  const resumen = aprobado ? await resumenDelVendedor(user.id) : null;
  const publicadas = resumen ? resumen.vigentes + resumen.retiradas : 0;
  const activas = resumen?.activas ?? 0;
  const vistas = resumen?.visitas ?? 0;

  return (
    <>
      <AppHeader />
      <main
        className={`mx-auto px-5 py-8 ${aprobado ? "max-w-5xl" : "max-w-md"}`}
      >
        <div className="mb-4">
          <Volver href="/" />
        </div>
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
                {/* Corrección 14: el resto de la frase («…lo que hace que un
                    comprador se anime a pagarle a alguien que no conoce») sonaba
                    a texto generado; Catalina pidió quitarlo. */}
                Tu perfil muestra el distintivo de identidad verificada.
              </p>

              {publicadas > 0 && (
                <dl className="mt-6 flex gap-8 border-t border-cream/20 pt-5">
                  <div>
                    <dt className="text-xs text-cream/70">
                      Publicaciones activas
                    </dt>
                    <dd className="font-title text-2xl font-semibold tabular-nums">
                      {activas}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-cream/70">Visitas en total</dt>
                    {/* En rango, como en «Tus publicaciones» (corrección 32). */}
                    <dd className="mt-1 font-title text-base font-semibold">
                      {rangoDeVisitas(vistas)}
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
                accion={
                  publicadas > 0 ? `Gestionar las ${publicadas}` : "Ver"
                }
              />
              <Atajo
                href="/actividad"
                titulo="Ventas y conversaciones"
                texto="Quién te escribió, qué te ofrecieron, qué hay que despachar."
                accion="Abrir"
              />
            </div>

            {/* Corrección 15: ya no hay «Registra tu tienda»; la empresa se elige
                al empezar a vender, y la carga en lote es solo para ella. */}
            {juridica?.nit_confirmado_at ? (
              <p className="mt-7 text-sm text-muted">
                Vendes como {sinPunto(juridica.legal_name)}.{" "}
                <Link href="/tienda" className="text-brand underline">
                  Cargar varios artículos de una vez
                </Link>
                .
              </p>
            ) : juridica ? (
              <p className="mt-7 rounded-xl bg-white p-4 text-sm text-ink2 shadow-xs ring-1 ring-line">
                Estamos revisando el RUT de {sinPunto(juridica.legal_name)}. Cuando confirmemos el
                NIT se activan la insignia de empresa y la carga en lote.
              </p>
            ) : null}

            {!vendedor && (
              <section className="mt-7 rounded-2xl bg-white p-5 shadow-xs ring-1 ring-line">
                <h2 className="font-title text-lg font-semibold">
                  Completa tus datos de vendedor
                </h2>
                <p className="mt-1 text-sm text-ink2">
                  La ley pide que tengamos una dirección y un teléfono de quien vende,
                  por si un comprador presenta una queja. No se muestran a nadie.
                </p>
                <CompletarDatosForm telefonoInicial={telefonoInicial} />
              </section>
            )}
          </>
        ) : v?.status === "pendiente" ? (
          <>
            <h1 className="font-title text-2xl font-semibold">
              Estamos revisando
            </h1>
            {/* El estado intermedio tiene que ser visible: estos procesos tardan y
                una pantalla muda se lee como una falla. */}
            <p className="mt-2 text-ink2">
              Tu verificación está en curso. Suele tardar unos minutos y te
              avisamos apenas haya respuesta. Puedes seguir explorando mientras
              tanto.
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
                <p className="mt-1">
                  {v.reason ?? "El proveedor no dio un motivo."}
                </p>
              </div>
            )}

            {vendedor && v && !tipoElegido ? (
              <>
              <ol className="mt-6 flex flex-col gap-3 text-sm text-ink2">
                <li>1. Foto de tu cédula por ambos lados, sin reflejos.</li>
                <li>2. Una selfie para confirmar que eres tú.</li>
                <li>
                  3. Listo. Nosotros no guardamos ni la cédula ni la selfie.
                </li>
              </ol>

              <form action={beginVerification} className="mt-7 flex flex-col gap-4">
                {/* Corrección 11: autorización explícita y aparte para el dato
                    biométrico, antes de que el proveedor lo pida. */}
                <label className="flex items-start gap-2.5 rounded-xl bg-white p-4 text-sm text-ink2 shadow-xs ring-1 ring-line">
                  <input
                    type="checkbox"
                    name="autorizoBiometricos"
                    value="si"
                    required
                    className="mt-0.5 size-4 shrink-0 accent-brand"
                  />
                  <span>
                    Autorizo que el proveedor de verificación trate la foto de mi rostro
                    para confirmar que soy quien dice mi cédula. Es un dato biométrico, y
                    por eso sensible: darlo es voluntario, pero sin él no puedo vender en
                    2venta. Ver la{" "}
                    <a href="/legal#datos" className="font-medium text-brand underline">
                      política de datos
                    </a>
                    .
                  </span>
                </label>
                {faltaAutorizacion && (
                  <p role="alert" className="text-sm text-danger">
                    Para verificar tu identidad necesitamos tu autorización para la foto
                    de tu rostro.
                  </p>
                )}
                <Button type="submit">
                  {v?.status === "rechazado"
                    ? "Volver a intentar"
                    : "Empezar verificación"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm">
                <Link href={`/vender?tipo=${vendedor.tipo}`} className="text-brand underline">
                  Cambiar mis datos de vendedor
                </Link>
              </p>
              </>
            ) : tipoElegido ? (
              <>
                <p className="mt-6 text-sm text-ink2">
                  {tipoElegido === "natural"
                    ? "Vendes como persona. Después verificas tu identidad con tu cédula y una selfie."
                    : "Vendes como empresa. Después, el representante legal verifica su identidad con su cédula y una selfie."}{" "}
                  <Link href="/vender" className="text-brand underline">
                    Cambiar
                  </Link>
                </p>
                <FormularioVendedor tipo={tipoElegido} telefonoInicial={telefonoInicial} />
              </>
            ) : (
              // Corrección 15 (decisión de Nicolás): persona natural o jurídica se
              // elige aquí, al empezar a vender, no al registrarse.
              <div className="mt-6 flex flex-col gap-3">
                <p className="text-sm font-medium">¿Cómo vas a vender?</p>
                <Link
                  href="/vender?tipo=natural"
                  className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-line transition duration-200 ease-salida hover:ring-brand/30"
                >
                  <span className="block font-medium">Como persona</span>
                  <span className="mt-0.5 block text-sm text-ink2">
                    Vendes cosas tuyas. Verificas tu identidad con tu cédula.
                  </span>
                </Link>
                <Link
                  href="/vender?tipo=juridica"
                  className="rounded-2xl bg-white p-4 shadow-xs ring-1 ring-line transition duration-200 ease-salida hover:ring-brand/30"
                >
                  <span className="block font-medium">Como empresa (persona jurídica)</span>
                  <span className="mt-0.5 block text-sm text-ink2">
                    Tienda, cambalache o negocio con NIT. Puedes cargar varios artículos
                    de una vez.
                  </span>
                </Link>
              </div>
            )}
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
    <div className="flex flex-col rounded-2xl bg-white shadow-xs p-5 ring-1 ring-line">
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

/** «Cambalache S.A.S.» sin su punto final, para no escribir «S.A.S..» en una frase. */
function sinPunto(texto: string): string {
  return texto.replace(/\.+$/, "");
}
