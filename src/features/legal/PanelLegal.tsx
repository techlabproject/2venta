"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui";
import { ContenidoLegal } from "./ContenidoLegal";
import { VERSION_TERMINOS } from "./version";

/**
 * Los Términos y la Política de datos en un panel que entra desde la derecha, con
 * «Aceptar» al final (corrección 11, decisión de Nicolás).
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
      onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
      // En el teléfono deja una franja del fondo a la izquierda: sin ella no había
      // «fuera» que tocar para cerrar (Luna, fila 11).
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[calc(100vw-2.5rem)] max-w-2xl bg-cream p-0 text-ink shadow-xl transition-[translate,overlay,display] duration-300 ease-salida transition-discrete not-open:translate-x-full starting:open:translate-x-full backdrop:bg-ink/40 motion-reduce:transition-none sm:rounded-l-2xl"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-4 sm:rounded-tl-2xl">
          <h2 id="titulo-legal" className="font-title text-lg font-semibold">
            Términos y política de datos
          </h2>
          <button
            type="button"
            aria-label="Cerrar los términos"
            onClick={() => dialogo.current?.close()}
            className="grid size-9 place-items-center rounded-xl text-ink2 transition hover:bg-ph"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

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
          <ContenidoLegal />

          <div className="mt-8 border-t border-line pt-5 pb-4">
            {alAceptar ? (
              <>
                <Button type="button" onClick={alAceptar}>
                  Aceptar
                </Button>
                <p className="mt-2 text-center text-xs text-muted">
                  Aceptas la versión {VERSION_TERMINOS}. Guardamos cuándo lo hiciste.
                </p>
              </>
            ) : aceptadoEl ? (
              <p className="text-sm text-ink2">
                Aceptaste la versión {VERSION_TERMINOS} el {aceptadoEl}.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </dialog>
  );
}
