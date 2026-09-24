"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * «Filtros» como panel que entra desde un costado (corrección 2 y 3, decisión de
 * Nicolás).
 *
 * Antes los filtros eran un bloque plegable encima de los resultados, y al abrirlo
 * se comía la pantalla entera del teléfono: se elegía a ciegas y había que bajar
 * para ver si había algo. El panel tapa la grilla mientras se elige, dice cuántos
 * artículos van quedando, y al cerrarlo deja la grilla completa.
 *
 * Sin JavaScript no hay panel: el botón es un enlace a `/buscar`, donde los
 * mismos filtros son un formulario normal (D-25).
 */
export function PanelDeFiltros({
  accion,
  respaldo,
  activos,
  total,
  limpiar,
  tono = "oscuro",
  children,
}: {
  /** A dónde se aplican los filtros: la portada filtra en su sitio. */
  accion: string;
  /** El enlace del botón cuando no hay JavaScript. */
  respaldo: string;
  /** Cuántos filtros hay puestos, para la marca del botón. */
  activos: number;
  /** Cuántos resultados dan los filtros actuales. */
  total: number;
  limpiar: string;
  /** Sobre la franja petróleo de la portada o sobre fondo claro (búsqueda). */
  tono?: "oscuro" | "claro";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dialogo = useRef<HTMLDialogElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const [conteo, setConteo] = useState<number | null>(total);
  const [contando, setContando] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Al aplicar, la página llega con otro total: se adopta el nuevo sin efecto,
  // durante el render, que es como React pide sincronizar con una prop.
  const [totalVisto, setTotalVisto] = useState(total);
  if (total !== totalVisto) {
    setTotalVisto(total);
    setConteo(total);
  }

  function consulta(): string {
    const datos = new FormData(formulario.current!);
    const params = new URLSearchParams();
    // Sin los campos vacíos: `?min=&max=&zona=` es ruido en una dirección que se
    // comparte por chat.
    for (const [clave, valor] of datos) {
      if (typeof valor !== "string" || !valor.trim()) continue;
      if (clave === "orden" && valor === "recientes") continue; // el de siempre
      params.append(clave, valor.trim());
    }
    return params.toString();
  }

  function recontar() {
    clearTimeout(temporizador.current);
    setContando(true);
    temporizador.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/buscar/conteo?${consulta()}`);
        setConteo(res.ok ? ((await res.json()) as { total: number }).total : null);
      } catch {
        setConteo(null);
      } finally {
        setContando(false);
      }
    }, 250);
  }

  function aplicar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const qs = consulta();
    dialogo.current?.close();
    router.push(qs ? `${accion}?${qs}` : accion, { scroll: false });
  }

  const etiqueta =
    conteo === null
      ? "Ver resultados"
      : conteo === 0
        ? // Se deja aplicar igual: el mensaje vacío ofrece salidas y el aviso de
          // cuando aparezca (corrección 5). Bloquearlo dejaba sin esa salida.
          "Aplicar igual (0 resultados)"
        : conteo === 1
          ? "Ver 1 resultado"
          : `Ver ${conteo} resultados`;

  return (
    <>
      <a
        href={respaldo}
        onClick={(e) => {
          e.preventDefault();
          dialogo.current?.showModal();
        }}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition duration-200 ease-salida active:scale-[0.97] ${
          tono === "oscuro"
            ? "border-cream/60 text-cream hover:border-cream hover:bg-cream/10"
            : "border-line bg-white text-ink shadow-xs hover:border-brand/30 hover:bg-ph"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        Filtros
        {activos > 0 && (
          <span
            className={`grid min-w-5 place-items-center rounded-full px-1.5 text-xs font-semibold ${
              tono === "oscuro" ? "bg-cream text-brand" : "bg-brand text-cream"
            }`}
          >
            {activos}
            <span className="sr-only"> activos</span>
          </span>
        )}
      </a>

      <dialog
        ref={dialogo}
        aria-labelledby="titulo-filtros"
        // Tocar fuera del panel lo cierra, como en cualquier hoja lateral.
        onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-[min(24rem,88vw)] max-w-none rounded-r-2xl bg-white p-0 text-ink shadow-xl transition-[translate,overlay,display] duration-300 ease-salida transition-discrete not-open:-translate-x-full starting:open:-translate-x-full backdrop:bg-ink/40 motion-reduce:transition-none"
      >
        <form
          ref={formulario}
          action={accion}
          method="get"
          onSubmit={aplicar}
          onChange={recontar}
          className="flex h-full flex-col"
        >
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 id="titulo-filtros" className="font-title text-lg font-semibold">
              Filtros
            </h2>
            <button
              type="button"
              aria-label="Cerrar filtros"
              onClick={() => dialogo.current?.close()}
              className="grid size-9 place-items-center rounded-xl text-ink2 transition hover:bg-ph"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
            {children}
          </div>

          <footer className="flex items-center gap-3 border-t border-line px-5 py-4">
            <a href={limpiar} className="text-sm text-ink2 underline">
              Limpiar
            </a>
            <button
              type="submit"
              aria-busy={contando}
              className="flex-1 rounded-xl border border-accent-edge/50 bg-accent px-4 py-3 text-sm font-medium text-on-accent transition duration-200 ease-salida hover:brightness-[0.97] active:scale-[0.98] disabled:opacity-60"
            >
              {etiqueta}
            </button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
