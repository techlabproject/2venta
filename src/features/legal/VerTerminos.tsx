"use client";

import { useState } from "react";
import { PanelLegal } from "./PanelLegal";

/** Abre los términos en solo lectura desde «Tu cuenta». Sin JavaScript, va a `/legal`. */
export function VerTerminos({ aceptadoEl }: { aceptadoEl?: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <a
        href="/legal"
        onClick={(e) => {
          e.preventDefault();
          setAbierto(true);
        }}
        className="text-sm font-medium text-brand underline"
      >
        Ver los términos y la política de datos
      </a>
      <PanelLegal abierto={abierto} alCerrar={() => setAbierto(false)} aceptadoEl={aceptadoEl} />
    </>
  );
}
