"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui";
import { ContenidoLegal } from "./ContenidoLegal";
import { VERSION_TERMINOS } from "./version";

/**
 * Los Términos y la Política de datos a pantalla completa, con «Aceptar» al final
 * (corrección 11). Antes era un panel que entraba desde la derecha y dejaba el
 * formulario asomado a la izquierda; Nicolás lo pidió a pantalla completa
 * (2026-09-25). El texto va en una columna centrada: una línea de todo el ancho
 * no se lee (D-70).
 *
 * Con `alAceptar` es el paso del registro: el botón está al final a propósito, para
 * que aceptar sea lo último después de leer. Sin él es solo lectura, desde «Tu
 * cuenta». El mismo texto vive en `/legal` para quien no tiene JavaScript y para
 * mandárselo al abogado.
 */
export function PanelLegal({
  abierto,
  alCerrar,
  alAceptar,
  aceptadoEl,
}: {
  abierto: boolean;
  alCerrar: () => void;
  alAceptar?: () => void;
  /** Cuándo aceptó, si ya lo hizo: en «Tu cuenta» se muestra en vez del botón. */
  aceptadoEl?: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const cuerpo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      cuerpo.current?.scrollTo({ top: 0 });
    }
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={dialogo}
      onClose={alCerrar}
      aria-labelledby="titulo-legal"
      // A pantalla completa no hay «fuera» que tocar: se cierra con la X de la
      // cabecera, que siempre está a la vista, o con Escape.
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-cream p-0 text-ink transition-[translate,opacity,overlay,display] duration-300 ease-salida transition-discrete not-open:translate-y-6 not-open:opacity-0 starting:open:translate-y-6 starting:open:opacity-0 backdrop:bg-ink/40 motion-reduce:transition-none"
    >
      <div className="flex h-full flex-col">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
            <h2 id="titulo-legal" className="font-title text-lg font-semibold">
              Términos y política de datos
            </h2>
            <button
              type="button"
              aria-label="Cerrar los términos"
              onClick={() => dialogo.current?.close()}
              className="grid size-9 place-items-center rounded-xl text-ink2 transition hover:bg-ph"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </header>
        {/* En el registro, qué hacer (D-130, decisión 6). */}
        {alAceptar && (
          <p className="border-b border-line bg-brand/10 px-5 py-2.5 text-center text-sm text-brand">
            Lee los términos y toca «Aceptar» para seguir con tu registro.
          </p>
        )}

        <div
          ref={cuerpo}
          // El índice son enlaces `#sección`: dentro del panel se desplaza el panel,
          // no la página de atrás, y la dirección no se llena de anclas.
          onClick={(e) => {
            const a = (e.target as HTMLElement).closest("a[href^='#']");
            if (!a) return;
            e.preventDefault();
            cuerpo.current
              ?.querySelector(a.getAttribute("href")!)
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="flex-1 overflow-y-auto px-5 py-6 [&_.nota-abogado]:hidden"
        >
          <div className="mx-auto max-w-3xl">
            <ContenidoLegal />

            {!alAceptar && aceptadoEl && (
              <div className="mt-8 border-t border-line pt-5 pb-4">
                <p className="text-sm text-ink2">
                  Aceptaste la versión {VERSION_TERMINOS} el {aceptadoEl}.
                </p>
              </div>
            )}
          </div>
        </div>
        {/* «Aceptar» fijo abajo, siempre a la vista (D-130, decisión 6): antes había
            que bajar hasta el final de un texto largo para encontrarlo. */}
        {alAceptar && (
          <footer className="border-t border-line bg-white px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-3xl">
              <Button type="button" onClick={alAceptar}>
                Aceptar
              </Button>
              <p className="mt-1.5 text-center text-xs text-muted">
                Aceptas la versión {VERSION_TERMINOS}. Guardamos cuándo lo hiciste.
              </p>
            </div>
          </footer>
        )}
      </div>
    </dialog>
  );
}
