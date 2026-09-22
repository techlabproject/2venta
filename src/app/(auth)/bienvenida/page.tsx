import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui";
import { conVolver } from "@/lib/destino";
import { Volver } from "@/components/Volver";

// Pantalla 1a del mockup: bienvenida y elección de rol.
export default async function Bienvenida({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string }>;
}) {
  const { volver } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8">
        <Volver href="/" />
      </div>
      <div className="text-brand">
        <Logo className="h-10 w-auto" />
      </div>

      <h1 className="mt-8 font-title text-3xl leading-tight font-semibold">
        Segunda mano,
        <br />
        primera confianza
      </h1>
      <p className="mt-3 text-ink2">
        Compra y vende usado en Bogotá con el pago guardado hasta que el
        producto llegue.
      </p>

      <div className="mt-9 flex flex-col gap-3">
        <ButtonLink
          href={conVolver("/registro?rol=comprador", volver)}
          variant="primary"
        >
          Quiero comprar
        </ButtonLink>
        <ButtonLink
          href={conVolver("/registro?rol=vendedor", volver)}
          variant="outline"
        >
          Quiero vender
        </ButtonLink>
      </div>

      <p className="mt-6 text-center text-sm text-ink2">
        Ya tengo cuenta ·{" "}
        <Link
          href={conVolver("/ingresar", volver)}
          className="font-medium text-brand underline"
        >
          Iniciar sesión
        </Link>
      </p>

      <p className="mt-8 text-center text-sm">
        <Link href="/" className="text-muted underline">
          Ver productos sin cuenta
        </Link>
      </p>
    </main>
  );
}
