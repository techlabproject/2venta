import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

// La pantalla por defecto de Next sale en inglés y sin la marca. Un comprador que
// abre un enlace viejo de un artículo ya vendido llega aquí, así que vale la pena
// que diga algo útil en vez de "This page could not be found".
//
// El texto no afirma que se trate de un artículo vendido: aquí también acaba quien
// pide una pantalla que no le corresponde, y decirle que «pudo venderse» lo manda a
// buscar una explicación falsa (ronda de usuario, 2026-09-14). A una pantalla que no
// es suya se le responde igual a propósito: confirmar que existe le diría a
// cualquiera que probara direcciones qué hay detrás.
export default function NotFound() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-title text-2xl font-semibold">No pudimos abrir esto</h1>
        <p className="mt-2 text-ink2">
          Si era un artículo, pudo venderse o el vendedor lo quitó: pasa seguido en
          segunda mano, cada cosa es única y dura poco. Si era otra pantalla, puede
          que no exista o que no sea tuya.
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
