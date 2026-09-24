"use client";

import { startTransition, useActionState } from "react";
import { Button, ErrorNote, Field } from "@/components/ui";
import { completarDatosVendedor, empezarComoVendedor, type VendedorResult } from "./actions";

function enviarSinBorrar(e: React.FormEvent<HTMLFormElement>, submit: (datos: FormData) => void) {
  e.preventDefault();
  const datos = new FormData(e.currentTarget);
  startTransition(() => submit(datos));
}

/** Dirección y teléfono: los pide el art. 53 a toda persona que vende. */
function DatosDeContacto({ telefonoInicial }: { telefonoInicial?: string }) {
  return (
    <>
      <Field
        id="direccion"
        name="direccion"
        label="Dirección de notificaciones"
        autoComplete="street-address"
        required
        placeholder="Calle 72 # 10-34, apto 501"
        hint="No se muestra en tu perfil. La ley pide tenerla por si un comprador presenta una queja."
      />
      <Field
        id="telefono"
        name="telefono"
        label="Teléfono de contacto"
        type="tel"
        autoComplete="tel"
        required
        defaultValue={telefonoInicial}
        placeholder="300 412 8805"
        hint="Celular o fijo con indicativo. Tampoco se muestra."
      />
    </>
  );
}

function Autorizacion() {
  return (
    <label className="flex items-start gap-2.5 rounded-xl bg-white p-4 text-sm text-ink2 shadow-xs ring-1 ring-line">
      <input
        type="checkbox"
        name="autorizoBiometricos"
        value="si"
        className="mt-0.5 size-4 shrink-0 accent-brand"
      />
      <span>
        Autorizo que el proveedor de verificación trate la foto de mi rostro para
        confirmar que soy quien dice mi cédula. Es un dato biométrico, y por eso
        sensible: darlo es voluntario, pero sin él no puedo vender en 2venta. Ver la{" "}
        <a href="/legal#datos" className="font-medium text-brand underline">
          política de datos
        </a>
        .
      </span>
    </label>
  );
}

/**
 * Los datos para empezar a vender, según el tipo (corrección 15). Al enviar se
 * guardan y se abre la verificación de identidad.
 */
export function FormularioVendedor({
  tipo,
  telefonoInicial,
}: {
  tipo: "natural" | "juridica";
  telefonoInicial?: string;
}) {
  const [result, submit, pending] = useActionState<VendedorResult | null, FormData>(
    empezarComoVendedor,
    null,
  );

  return (
    // `onSubmit` y no `action`: con `action`, React vacía el formulario después de
    // cada envío y un solo error obligaba a llenarlo todo de nuevo, RUT incluido.
    <form onSubmit={(e) => enviarSinBorrar(e, submit)} className="mt-6 flex flex-col gap-4">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="tipo" value={tipo} />

      {tipo === "juridica" && (
        <>
          <Field id="legalName" name="legalName" label="Razón social" required placeholder="Cambalache El Centro S.A.S." />
          <Field id="nit" name="nit" label="NIT" required inputMode="numeric" placeholder="900.123.456-7" hint="Con o sin el dígito de verificación." />
          <Field id="repNombre" name="repNombre" label="Nombre del representante legal" required autoComplete="name" />
          <Field
            id="repCedula"
            name="repCedula"
            label="Cédula del representante legal"
            required
            inputMode="numeric"
            hint="Es quien hace la verificación de identidad con su cédula y una selfie."
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rut" className="text-sm font-medium">
              RUT de la empresa (PDF)
            </label>
            <input
              id="rut"
              name="rut"
              type="file"
              accept="application/pdf"
              required
              className="text-sm file:mr-3 file:rounded-xl file:border file:border-line file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium"
            />
            <p className="text-xs text-muted">
              Máximo 2 MB. Lo revisa una persona del equipo para confirmar el NIT; no se
              publica.
            </p>
          </div>
        </>
      )}

      <DatosDeContacto telefonoInicial={telefonoInicial} />
      <Autorizacion />

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Empezar verificación"}
      </Button>
    </form>
  );
}

/** Para quien ya vendía antes de la corrección 15: dirección y teléfono (art. 53). */
export function CompletarDatosForm({ telefonoInicial }: { telefonoInicial?: string }) {
  const [result, submit, pending] = useActionState<VendedorResult | null, FormData>(
    completarDatosVendedor,
    null,
  );
  if (result && !result.error) {
    return (
      <p role="status" className="mt-3 rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand">
        ¡Listo! Guardamos tus datos de contacto.
      </p>
    );
  }
  return (
    <form onSubmit={(e) => enviarSinBorrar(e, submit)} className="mt-4 flex flex-col gap-4">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <DatosDeContacto telefonoInicial={telefonoInicial} />
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? "Guardando…" : "Guardar mis datos"}
      </Button>
    </form>
  );
}
