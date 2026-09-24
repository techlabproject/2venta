"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestRecovery,
  resetPassword,
  type RecoveryResult,
} from "./recovery";
import { Button, ErrorNote, Field } from "@/components/ui";
import { CampoCodigo } from "@/components/CampoCodigo";
import { CampoCelular } from "@/components/CampoCelular";

export function RecoveryForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");

  const [asked, ask, asking] = useActionState<RecoveryResult | null, FormData>(
    async (prev, form) => {
      setPhone(String(form.get("phone") ?? ""));
      return requestRecovery(prev, form);
    },
    null,
  );

  const [reset, doReset, resetting] = useActionState<
    RecoveryResult | null,
    FormData
  >(async (prev, form) => {
    const res = await resetPassword(prev, form);
    if (res.verified) {
      // Invalidar antes de navegar (ver VerifyForm).
      router.refresh();
      router.push("/ingresar?recuperada=1");
    }
    return res;
  }, null);

  if (!asked?.sent) {
    return (
      <form action={ask} className="flex flex-col gap-4">
        {asked?.error ? <ErrorNote>{asked.error}</ErrorNote> : null}
        <CampoCelular
          id="phone"
          name="phone"
          label="Tu celular"
          required
          autoComplete="tel"
          hint="Te mandamos un código para cambiar tu contraseña."
        />
        <Button type="submit" disabled={asking}>
          {asking ? "Mandando…" : "Mandar código"}
        </Button>
      </form>
    );
  }

  return (
    <form action={doReset} className="flex flex-col gap-4">
      {reset?.error ? <ErrorNote>{reset.error}</ErrorNote> : null}
      {/* Se responde lo mismo exista o no la cuenta: decir "ese celular no está
          registrado" dejaría averiguar qué números tienen cuenta en 2venta. */}
      <p
        role="status"
        className="rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand"
      >
        Si ese celular tiene una cuenta, le mandamos un código.
      </p>
      <input type="hidden" name="phone" value={phone} />

      <CampoCodigo
        id="code"
        name="code"
        required
      />
      <Field
        id="password"
        name="password"
        type="password"
        label="Nueva contraseña"
        autoComplete="new-password"
        required
        minLength={8}
        hint="Mínimo ocho caracteres."
      />

      <Button type="submit" disabled={resetting}>
        {resetting ? "Cambiando…" : "Cambiar contraseña"}
      </Button>
      <p className="text-xs text-muted">
        Cambiarla cierra las demás sesiones abiertas en tu cuenta.
      </p>
    </form>
  );
}
