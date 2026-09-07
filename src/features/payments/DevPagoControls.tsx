"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

// Dispara el mismo webhook firmado que mandaría el proveedor real, para que el
// camino que se ejercita en desarrollo sea exactamente el de producción.
export function DevPagoControls({
  reference,
  orderId,
}: {
  reference: string;
  orderId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function send(type: "pago.aprobado" | "pago.rechazado") {
    setBusy(true);
    await fetch("/api/dev/pago-callback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventId: `evt_${crypto.randomUUID()}`,
        reference,
        type,
      }),
    });
    setBusy(false);
    router.push(`/pedido/${orderId}`);
    router.refresh();
  }

  return (
    <div className="mt-7 flex flex-col gap-3">
      <Button type="button" disabled={busy} onClick={() => send("pago.aprobado")}>
        Simular pago aprobado
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => send("pago.rechazado")}
      >
        Simular pago rechazado
      </Button>
    </div>
  );
}
