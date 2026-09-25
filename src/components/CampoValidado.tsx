"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Field } from "./ui";

/**
 * Un campo que revisa lo escrito al salir de él (corrección 6, decisión de
 * Nicolás; mismo patrón para el celular y el código, correcciones 7 y 8).
 *
 * - Mientras se escribe no regaña: nadie quiere un error rojo por un correo a medio
 *   escribir.
 * - Al salir del campo, si algo está mal, se marca y se dice qué.
 * - Una vez marcado, el error se va solo apenas lo escrito queda bien.
 * - Al enviar se revisa otra vez y, si está mal, el envío no sale y el foco vuelve
 *   al campo: la validación del navegador está apagada (`noValidate`) para que los
 *   mensajes sean nuestros y en español.
 *
 * `limpiar` transforma lo que se escribe (el celular solo admite dígitos).
 * `debajo` pinta algo bajo el campo con el valor actual, como una sugerencia.
 */
export function CampoValidado({
  validar,
  limpiar,
  debajo,
  onBlur,
  onInput,
  ...props
}: Omit<ComponentProps<typeof Field>, "error"> & {
  validar: (valor: string) => string | null;
  limpiar?: (valor: string) => string;
  debajo?: (valor: string, cambiar: (nuevo: string) => void) => ReactNode;
}) {
  const campo = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [valor, setValor] = useState(String(props.defaultValue ?? ""));

  useEffect(() => {
    const formulario = campo.current?.form;
    if (!formulario) return;
    // En captura y en el formulario: corre antes que el `onSubmit` de React (que
    // escucha en la raíz), y detenerlo aquí impide que el envío salga.
    function alEnviar(e: SubmitEvent) {
      const problema = validar(campo.current?.value ?? "");
      if (!problema) return;
      e.preventDefault();
      // `stopPropagation` y no `stopImmediatePropagation`: si hay otro campo con
      // error en el mismo formulario, que también se marque. El foco va al primero.
      e.stopPropagation();
      setError(problema);
      const marca = e as SubmitEvent & { _enfocado?: boolean };
      if (!marca._enfocado) {
        campo.current?.focus();
        marca._enfocado = true;
      }
    }
    formulario.addEventListener("submit", alEnviar, true);
    return () => formulario.removeEventListener("submit", alEnviar, true);
  }, [validar]);

  // Solo corre al tocar algo de `debajo` (la sugerencia). Busca el campo por su
  // `id` y no por la ref: esta función viaja durante el render.
  const id = props.id;
  function cambiar(nuevo: string) {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) return;
    input.value = nuevo;
    setValor(nuevo);
    setError(validar(nuevo));
    input.focus();
  }

  return (
    <div>
      <Field
        {...props}
        ref={campo}
        error={error}
        onInput={(e) => {
          if (limpiar) {
            const input = e.currentTarget;
            // El cursor vuelve a quedar después del mismo carácter útil: si no,
            // corregir un dígito en medio lo mandaba al final.
            const esUtil = (c: string) => /[\p{L}\p{N}]/u.test(c);
            const utiles = (t: string) => [...t].filter(esUtil).length;
            let bruto = input.value;
            let antes = utiles(bruto.slice(0, input.selectionStart ?? bruto.length));
            let limpio = limpiar(bruto);
            // Borrar hacia atrás un separador que el campo puso solo («300 |412»)
            // no cambiaba nada y la tecla parecía muerta: se borra el dígito de
            // antes, que es lo que la persona quería (Luna, corrección 7).
            const tipo = (e.nativeEvent as InputEvent).inputType;
            if (tipo === "deleteContentBackward" && limpio === valor && antes > 0) {
              let vistos = 0;
              const letras = [...bruto];
              const i = letras.findIndex((c) => esUtil(c) && ++vistos === antes);
              letras.splice(i, 1);
              bruto = letras.join("");
              antes -= 1;
              limpio = limpiar(bruto);
            }
            // Lo mismo con Supr delante del separador («260|.000»): se borra el
            // dígito de después (Luna, correcciones 7 y 24).
            if (tipo === "deleteContentForward" && limpio === valor) {
              let vistos = 0;
              const letras = [...bruto];
              const i = letras.findIndex((c) => esUtil(c) && ++vistos === antes + 1);
              if (i >= 0) {
                letras.splice(i, 1);
                bruto = letras.join("");
                limpio = limpiar(bruto);
              }
            }
            if (limpio !== input.value) {
              input.value = limpio;
              let pos = 0;
              while (pos < limpio.length && utiles(limpio.slice(0, pos)) < antes) pos++;
              input.setSelectionRange(pos, pos);
            }
          }
          setValor(e.currentTarget.value);
          // Solo se re-evalúa si ya estaba marcado: así el error se va apenas se
          // corrige, pero no aparece mientras se escribe por primera vez.
          if (error) setError(validar(e.currentTarget.value));
          onInput?.(e);
        }}
        onBlur={(e) => {
          // Un campo vacío al pasar de largo no es un error todavía: lo será al
          // enviar, si sigue vacío.
          if (e.currentTarget.value.trim()) setError(validar(e.currentTarget.value));
          onBlur?.(e);
        }}
      />
      {debajo?.(valor, cambiar)}
    </div>
  );
}
