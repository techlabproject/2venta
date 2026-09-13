import Link from "next/link";
import { redirect } from "next/navigation";
import { activeUser } from "@/lib/session";
import { getVerification } from "@/features/kyc/queries";
import { beginVerification } from "@/features/kyc/actions";
import { AppHeader } from "@/components/AppHeader";
import { Button, ButtonLink } from "@/components/ui";
import { VerifiedBadge } from "@/components/VerifiedBadge";

// Pantalla 1c del mockup. D-02: el vendedor verifica identidad al crear la cuenta,
// antes de publicar, no antes de cobrar.
export const dynamic = "force-dynamic";

export default async function Vender() {
  // Una cuenta suspendida no llega a las pantallas que escriben.
  const user = await activeUser();
  // D-01: sin celular confirmado no se entra al circuito de vendedor.
  if (!user.phoneNumberVerified) redirect("/verificar");

  const v = await getVerification(user.id);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-8">
        {v?.status === "aprobado" ? (
          <>
            <h1 className="font-title text-2xl font-semibold">Tu espacio de vendedor</h1>
            <p className="mt-2 flex items-center gap-2 text-ink2">
              <VerifiedBadge label="Identidad verificada" />
            </p>
            <p className="mt-2 text-ink2">
              Tu perfil muestra el distintivo de identidad verificada, que es lo que
              hace que un comprador se anime a pagarle a alguien que no conoce.
            </p>

            {/* Antes esta pantalla decía «ya puedes publicar» y el único enlace
                llevaba al catálogo: quien llegaba aquí a vender se quedaba sin
                salida, y sus publicaciones no se podían encontrar desde ninguna
                parte de la interfaz. */}
            <div className="mt-7 flex flex-col gap-3">
              <ButtonLink href="/publicar">Publicar un artículo</ButtonLink>
              <ButtonLink href="/vender/metricas" variant="outline">
                Mis publicaciones
              </ButtonLink>
              <ButtonLink href="/actividad" variant="ghost">
                Mis ventas y conversaciones
              </ButtonLink>
            </div>

            <p className="mt-6 text-sm text-muted">
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
