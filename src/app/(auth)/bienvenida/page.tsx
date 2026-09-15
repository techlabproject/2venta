import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui";

// Pantalla 1a del mockup: bienvenida y elección de rol.
export default function Bienvenida() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
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
        <ButtonLink href="/registro?rol=comprador" variant="primary">
          Quiero comprar
        </ButtonLink>
        <ButtonLink href="/registro?rol=vendedor" variant="outline">
          Quiero vender
        </ButtonLink>
      </div>

      <p className="mt-6 text-center text-sm text-ink2">
        Ya tengo cuenta ·{" "}
        <Link href="/ingresar" className="font-medium text-brand underline">
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
