"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { sendCode } from "./actions";
import { Button, ErrorNote, Field } from "@/components/ui";

/**
 * Pide el celular a quien entró con Google.
 *
 * Google trae correo, no número. Y la D-01 dice que sin celular verificado no se
 * compra ni se escribe, así que este paso no se puede saltar: es lo que impide que
 * alguien estafe y vuelva a entrar con otra cuenta de Google en dos minutos.
 */
export function PhoneForm() {
  const router = useRouter();
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

    const updated = await authClient.updateUser({ phoneNumber: phone });
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

    router.push("/verificar");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Field
        id="phone"
        name="phone"
        type="tel"
        label="Tu celular"
        autoComplete="tel"
        required
        placeholder="300 412 88 05"
        hint="Te mandamos un código para confirmarlo."
      />
      <Button type="submit" disabled={busy}>
        {busy ? "Mandando el código…" : "Mandar código"}
      </Button>
    </form>
  );
}
