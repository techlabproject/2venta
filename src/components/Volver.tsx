"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { anterior } from "@/lib/rastro";

// El botón de devolverse era, en las trece pantallas que lo tienen, un
// `<Link className="text-sm text-ink2 underline">`. Texto subrayado y nada más:
// sin forma, sin contorno, sin dirección, del mismo peso visual que cualquier
// enlace dentro de un párrafo. Es el control que más se usa en un teléfono y era
// el único que no parecía un control.
//
// Aquí pasa a ser un objeto: cápsula blanca con el mismo anillo `line` que las
// tarjetas, para que se lea como una pieza de la interfaz y no como una palabra
// suelta. La flecha hace el trabajo que el subrayado no hacía —decir hacia dónde
// va— y al pasar el puntero se corre dos píxeles hacia la izquierda: es el único
// movimiento del componente y cumple la D-86, porque explica la dirección en vez
// de adornar.
//
// A dónde lleva (D-99): a la pantalla de 2venta de la que se vino, según el
// recorrido de la pestaña (`src/lib/rastro.ts`). `href` es el respaldo cuando no
// hay recorrido —se entró por un enlace externo, o sin JavaScript— y debe ser la
// pantalla padre, no la portada. Cuando el texto nombra un destino («Volver a tu
// cuenta») se pasa `fijo`: un botón que dice a dónde va tiene que ir ahí.
/**
 * ¿La entrada anterior del historial de esta pestaña es `destino`?
 *
 * Entonces «Volver» retrocede en vez de sumar una entrada: si la sumaba, el atrás
 * del navegador devolvía a la pantalla de la que se acababa de volver (Luna, fila
 * 18). Se pregunta al navegador (Navigation API) y no al recorrido, porque el
 * recorrido junta en una sola entrada los cambios de filtro que el historial
 * guarda uno por uno. Sin esa API se suma la entrada, como antes.
 */
function esLaEntradaAnterior(destino: string): boolean {
  type Entrada = { url: string | null; index: number };
  const nav = (globalThis as { navigation?: { currentEntry: Entrada | null; entries(): Entrada[] } })
    .navigation;
  const actual = nav?.currentEntry;
  if (!nav || !actual || actual.index < 1) return false;
  const previa = nav.entries()[actual.index - 1]?.url;
  if (!previa) return false;
  const url = new URL(previa);
  return url.origin === location.origin && url.pathname + url.search === destino;
}

export function Volver({
  href,
  fijo = false,
  children = "Volver",
}: {
  href: string;
  fijo?: boolean;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  function alTocar(e: React.MouseEvent<HTMLAnchorElement>) {
    // Abrir en otra pestaña es cosa de quien toca, y ahí el respaldo es lo correcto.
    if (fijo || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    const actual = location.pathname + location.search;
    const destino = anterior(actual);
    if (!destino) return;
    e.preventDefault();
    if (esLaEntradaAnterior(destino)) router.back();
    else router.push(destino);
  }

  return (
    <Link
      href={href}
      onClick={alTocar}
      className="group inline-flex w-auto items-center gap-1.5 rounded-xl border border-line bg-white py-2 pr-3.5 pl-2.5 text-sm font-medium text-ink2 shadow-xs transition duration-200 ease-salida hover:border-brand/30 hover:bg-ph hover:text-ink active:scale-[0.98] active:shadow-none"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4 shrink-0 transition-transform duration-200 ease-salida group-hover:-translate-x-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
      {children}
    </Link>
  );
}
