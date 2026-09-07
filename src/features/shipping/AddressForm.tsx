"use client";

import { useActionState, useState } from "react";
import { buyListing, type BuyResult } from "@/features/payments/actions";
import { Button, ErrorNote, Field } from "@/components/ui";
import { formatCop } from "@/lib/money";

export function AddressForm({
  listingId,
  priceCop,
  shippingCop,
  zones,
  offerId,
}: {
  listingId: string;
  priceCop: number;
  shippingCop: number;
  zones: string[];
  offerId?: string;
}) {
  const [result, submit, pending] = useActionState<BuyResult | null, FormData>(
    buyListing,
    null
  );
  // D-19: en persona no se paga envío, y el pago se libera con un código en el
  // momento del encuentro.
  const [presencial, setPresencial] = useState(false);
  const envio = presencial ? 0 : shippingCop;

  return (
    <form action={submit} className="flex flex-col gap-4">
      {result?.error && <ErrorNote>{result.error}</ErrorNote>}
      <input type="hidden" name="listingId" value={listingId} />
      {offerId && <input type="hidden" name="offerId" value={offerId} />}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">¿Cómo lo recibes?</legend>
        <label className="flex items-start gap-2.5 rounded-xl bg-white p-3 text-sm">
          <input type="radio" name="metodo" value="envio" className="mt-0.5"
            checked={!presencial} onChange={() => setPresencial(false)} />
          <span>
            <span className="font-medium">Te lo enviamos</span>
            <span className="block text-muted">
              Llega con guía. Confirmas al recibirlo y ahí le pagamos al vendedor.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2.5 rounded-xl bg-white p-3 text-sm">
          <input type="radio" name="metodo" value="presencial" className="mt-0.5"
            checked={presencial} onChange={() => setPresencial(true)} />
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
          <select id="meetingZone" name="meetingZone" required defaultValue=""
            className="rounded-xl border border-brand/20 bg-white px-4 py-3 text-sm">
            <option value="" disabled>Elige una zona</option>
            {zones.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          <p className="text-xs text-muted">
            El punto y la hora los acuerdan por el chat.
          </p>
        </div>
      ) : (
      <>
      <Field id="recipient" name="recipient" label="Quién recibe" required
        autoComplete="name" placeholder="Laura Torres" />
      <Field id="phone" name="phone" label="Celular de quien recibe" type="tel" required
        autoComplete="tel" placeholder="300 412 88 05"
        hint="Lo usa la transportadora para coordinar la entrega." />
      <Field id="line1" name="line1" label="Dirección" required
        autoComplete="street-address" placeholder="Calle 72 #10-34" />
      <Field id="details" name="details" label="Apartamento, torre, referencia"
        placeholder="Torre 2, apto 501" />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="zone" className="text-sm font-medium">Zona</label>
        <select id="zone" name="zone" required defaultValue=""
          className="rounded-xl border border-brand/20 bg-white px-4 py-3 text-sm">
          <option value="" disabled>Elige tu zona</option>
          {zones.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>

      <Field id="notes" name="notes" label="Nota para la entrega"
        placeholder="Dejar en portería si no estoy" />
      </>
      )}

      <dl className="mt-2 flex flex-col gap-1.5 rounded-2xl bg-white p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Producto</dt>
          <dd>{formatCop(priceCop)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Envío</dt>
          <dd data-testid="envio">{presencial ? "Sin costo" : formatCop(envio)}</dd>
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
