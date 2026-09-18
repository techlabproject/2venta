"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { buyListing, type BuyResult } from "@/features/payments/actions";
import { Button, ErrorNote, Field } from "@/components/ui";
import { formatCop } from "@/lib/money";

// Los datos de entrega se recuerdan en este navegador mientras se arma la compra.
//
// Quien entraba al pago y le daba a «atrás» volvía a un formulario en blanco y
// tenía que reescribir nombre, celular y dirección, sin que nadie le avisara de que
// se iban a perder (ronda de usuario, 2026-09-14). Es una comodidad de este
// dispositivo y nada más: no sale del navegador, y si el almacenamiento está
// bloqueado —ventana privada, permisos— el formulario funciona igual, en blanco.
const RECUERDO = "2venta:entrega";
const RECORDADOS = [
  "recipient",
  "phone",
  "line1",
  "details",
  "zone",
  "notes",
  "meetingZone",
] as const;

function campo(form: HTMLFormElement, nombre: string) {
  const el = form.elements.namedItem(nombre);
  return el instanceof HTMLInputElement || el instanceof HTMLSelectElement
    ? el
    : null;
}

export function AddressForm({
  listingId,
  priceCop,
  shippingCop,
  zones,
  offerId,
  fromCart = false,
}: {
  listingId: string;
  priceCop: number;
  shippingCop: number;
  zones: string[];
  offerId?: string;
  fromCart?: boolean;
}) {
  const [result, submit, pending] = useActionState<BuyResult | null, FormData>(
    buyListing,
    null,
  );
  // D-19: en persona no se paga envío, y el pago se libera con un código en el
  // momento del encuentro.
  const [presencial, setPresencial] = useState(false);
  const envio = presencial ? 0 : shippingCop;

  const form = useRef<HTMLFormElement>(null);

  // Se repite al cambiar de modo porque los campos de dirección se montan y se
  // desmontan con él: sin eso, volver a «te lo enviamos» los dejaría vacíos.
  useEffect(() => {
    const el = form.current;
    if (!el) return;
    try {
      const guardado = JSON.parse(localStorage.getItem(RECUERDO) ?? "{}");
      for (const nombre of RECORDADOS) {
        const valor = guardado?.[nombre];
        const input = campo(el, nombre);
        if (input && typeof valor === "string" && valor) input.value = valor;
      }
    } catch {
      // Ventana privada o almacenamiento bloqueado: se sigue con el formulario
      // en blanco, que es exactamente lo que había antes.
    }
  }, [presencial]);

  function recordar() {
    const el = form.current;
    if (!el) return;
    try {
      const datos: Record<string, string> = {};
      for (const nombre of RECORDADOS) {
        const input = campo(el, nombre);
        if (input) datos[nombre] = input.value;
      }
      localStorage.setItem(RECUERDO, JSON.stringify(datos));
    } catch {
      // Igual que arriba: no poder recordar no puede impedir comprar.
    }
  }

  return (
    <form
      ref={form}
      action={submit}
      onChange={recordar}
      className="flex flex-col gap-4"
    >
      {result?.error && <ErrorNote>{result.error}</ErrorNote>}
      <input type="hidden" name="listingId" value={listingId} />
      {offerId && <input type="hidden" name="offerId" value={offerId} />}
      {fromCart && <input type="hidden" name="desdeCarrito" value="1" />}
      {/* El total que el comprador está viendo. Si cambia antes de confirmar, no
          se cobra: ver más arriba en buyListing. */}
      <input type="hidden" name="totalEsperado" value={priceCop} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">¿Cómo lo recibes?</legend>
        <label className="flex items-start gap-2.5 rounded-xl bg-white p-3 text-sm">
          <input
            type="radio"
            name="metodo"
            value="envio"
            className="mt-0.5"
            checked={!presencial}
            onChange={() => setPresencial(false)}
          />
          <span>
            <span className="font-medium">Te lo enviamos</span>
            <span className="block text-muted">
              Llega con guía. Confirmas al recibirlo y ahí le pagamos al
              vendedor.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2.5 rounded-xl bg-white p-3 text-sm">
          <input
            type="radio"
            name="metodo"
            value="presencial"
            className="mt-0.5"
            checked={presencial}
            onChange={() => setPresencial(true)}
          />
          <span>
            <span className="font-medium">Nos vemos en persona</span>
            <span className="block text-muted">
              Sin costo de envío. Revisas el producto y le dictas un código que
              libera el pago ahí mismo. Nunca entregas efectivo.
            </span>
          </span>
        </label>
      </fieldset>

      {presencial ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="meetingZone" className="text-sm font-medium">
            ¿En qué zona se ven?
          </label>
          <select
            id="meetingZone"
            name="meetingZone"
            required
            defaultValue=""
            className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
          >
            <option value="" disabled>
              Elige una zona
            </option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">
            El punto y la hora los acuerdan por el chat.
          </p>
        </div>
      ) : (
        <>
          <Field
            id="recipient"
            name="recipient"
            label="Quién recibe"
            required
            autoComplete="name"
            placeholder="Laura Torres"
          />
          <Field
            id="phone"
            name="phone"
            label="Celular de quien recibe"
            type="tel"
            required
            autoComplete="tel"
            placeholder="300 412 88 05"
            hint="Lo usa la transportadora para coordinar la entrega."
          />
          <Field
            id="line1"
            name="line1"
            label="Dirección"
            required
            autoComplete="street-address"
            placeholder="Calle 72 #10-34"
          />
          <Field
            id="details"
            name="details"
            label="Apartamento, torre, referencia"
            placeholder="Torre 2, apto 501"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="zone" className="text-sm font-medium">
              Zona
            </label>
            <select
              id="zone"
              name="zone"
              required
              defaultValue=""
              className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
            >
              <option value="" disabled>
                Elige tu zona
              </option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <Field
            id="notes"
            name="notes"
            label="Nota para la entrega"
            placeholder="Dejar en portería si no estoy"
          />
        </>
      )}

      <dl className="mt-2 flex flex-col gap-1.5 rounded-2xl bg-white shadow-xs p-4 text-sm ring-1 ring-line">
        <div className="flex justify-between">
          <dt className="text-muted">Producto</dt>
          <dd>{formatCop(priceCop)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Envío</dt>
          <dd data-testid="envio">
            {presencial ? "Sin costo" : formatCop(envio)}
          </dd>
        </div>
        <div className="mt-1 flex justify-between border-t border-line pt-2 font-medium">
          <dt>Total</dt>
          <dd data-testid="total-checkout">{formatCop(priceCop + envio)}</dd>
        </div>
      </dl>

      {!presencial && (
        <p className="text-xs text-muted">
          Tu dirección la ven la transportadora y el vendedor solo dentro de la
          guía. No aparece en tu perfil ni en ninguna parte pública.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Preparando el pago…" : "Ir a pagar"}
      </Button>
    </form>
  );
}
