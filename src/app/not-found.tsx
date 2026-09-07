import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

// La pantalla por defecto de Next sale en inglés y sin la marca. Un comprador que
// abre un enlace viejo de un artículo ya vendido llega aquí, así que vale la pena
// que diga algo útil en vez de "This page could not be found".
export default function NotFound() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-title text-2xl font-semibold">Esto ya no está</h1>
        <p className="mt-2 text-ink2">
          El artículo pudo haberse vendido o el vendedor lo quitó. Pasa seguido en
          segunda mano: cada cosa es única y dura poco.
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-medium text-on-accent"
          >
            Ver lo que hay ahora
          </Link>
          <Link
            href="/buscar"
            className="inline-flex items-center justify-center rounded-xl border border-brand/25 bg-white px-4 py-3 text-sm font-medium"
          >
            Buscar algo parecido
          </Link>
        </div>
      </main>
    </>
  );
}
