"use client";

import type { ComponentProps } from "react";
import { CampoValidado } from "./CampoValidado";
import { problemaDeCorreo, sugerenciaDeCorreo } from "@/lib/correo";

/**
 * El correo de entrar y registrarse (corrección 6): se revisa al salir del campo y,
 * si el dominio se parece a uno común mal escrito, se ofrece «¿Quisiste decir…?»
 * con un toque para corregirlo.
 */
export function CampoCorreo(
  props: Omit<ComponentProps<typeof CampoValidado>, "validar" | "debajo" | "type">,
) {
  return (
    <CampoValidado
      {...props}
      type="email"
      validar={problemaDeCorreo}
      debajo={(valor, cambiar) => {
        const sugerencia = sugerenciaDeCorreo(valor);
        if (!sugerencia) return null;
        return (
          <p className="mt-1.5 text-xs text-ink2">
            ¿Quisiste decir{" "}
            <button
              type="button"
              onClick={() => cambiar(sugerencia)}
              className="font-medium text-brand underline"
            >
              {sugerencia}
            </button>
            ?
          </p>
        );
      }}
    />
  );
}
