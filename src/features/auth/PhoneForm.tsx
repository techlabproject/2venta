"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { sendCode } from "./actions";
import { Button, ErrorNote, Field } from "@/components/ui";
import { CampoCelular } from "@/components/CampoCelular";
import { conVolver } from "@/lib/destino";

/**
 * Pide el celular a quien entró con Google.
 *
 * Google trae correo, no número. Y la D-01 dice que sin celular verificado no se
 * compra ni se escribe, así que este paso no se puede saltar: es lo que impide que
 * alguien estafe y vuelva a entrar con otra cuenta de Google en dos minutos.
 */
export function PhoneForm() {
  const router = useRouter();
  const volver = useSearchParams().get("volver");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const raw = String(new FormData(e.currentTarget).get("phone"));
    const digits = raw.replace(/\D/g, "").replace(/^57/, "");
    if (!/^3\d{9}$/.test(digits)) {
      setError(
        "Escribe un celular colombiano de 10 dígitos, por ejemplo 300 412 88 05.",
      );
      setBusy(false);
      return;
    }
    const phone = `+57${digits}`;

    // Si el SDK rechaza —red caída, servidor sin responder— antes no se pintaba
    // nada: el formulario se quedaba pensando para siempre con el botón apagado
    // y sin decir por qué (ronda de verificación, 2026-09-20).
    let updated;
    try {
      updated = await authClient.updateUser({ phoneNumber: phone });
    } catch {
      setError("No pudimos conectarnos. Revisa tu conexión e intenta otra vez.");
      setBusy(false);
      return;
    }
    if (updated.error) {
      setError(
        /exist/i.test(updated.error.message ?? "")
          ? "Ese celular ya está en otra cuenta."
          : "No pudimos guardar tu celular. Intenta de nuevo.",
      );
      setBusy(false);
      return;
    }

    const sent = await sendCode();
    if (sent.error) {
      setError(sent.error);
      setBusy(false);
      return;
    }

    // Invalidar antes de navegar (ver VerifyForm).
    router.refresh();
    router.replace(conVolver("/verificar", volver));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <ErrorNote>{error}</ErrorNote>}
      <CampoCelular
        id="phone"
        name="phone"
        label="Tu celular"
        autoComplete="tel"
        required
        hint="Te mandamos un código para confirmarlo."
      />
      <Button type="submit" disabled={busy}>
        {busy ? "Mandando el código…" : "Mandar código"}
      </Button>
    </form>
  );
}
