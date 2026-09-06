"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

// Dispara el mismo webhook firmado que mandaría el proveedor real, para que el
// camino que se ejercita en desarrollo sea exactamente el de producción.
export function DevKycControls({ reference }: { reference: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function send(status: "aprobado" | "rechazado") {
    setBusy(true);
    await fetch("/api/dev/kyc-callback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reference,
        status,
        reason: status === "rechazado" ? "La foto de la cédula salió borrosa." : null,
      }),
    });
    setBusy(false);
    router.push("/vender");
    router.refresh();
  }

  return (
    <div className="mt-7 flex flex-col gap-3">
      <Button type="button" disabled={busy} onClick={() => send("aprobado")}>
        Simular aprobación
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => send("rechazado")}
      >
        Simular rechazo
      </Button>
    </div>
  );
}
