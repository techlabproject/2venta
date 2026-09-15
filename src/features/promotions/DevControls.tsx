"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function DevDestacarControls({
  reference,
  listingId,
}: {
  reference: string;
  listingId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function send(type: "pago.aprobado" | "pago.rechazado") {
    setBusy(true);
    await fetch("/api/dev/destacar-callback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reference, type }),
    });
    setBusy(false);
    router.push(`/producto/${listingId}`);
    router.refresh();
  }

  return (
    <div className="mt-7 flex flex-col gap-3">
      <Button
        type="button"
        disabled={busy}
        onClick={() => send("pago.aprobado")}
      >
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
