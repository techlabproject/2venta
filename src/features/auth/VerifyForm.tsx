"use client";

import { CODIGO_VALIDO_MINUTOS } from "./vigencia";

import { useActionState, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendCode, verifyCode, type OtpResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";
import { CampoCodigo } from "@/components/CampoCodigo";
import { digitosDeCelular, formatearCelular } from "@/lib/celular";

/** «+573001110003» → «+57 300 111 0003», como se dice en voz alta. */
const mostrarCelular = (p: string) => `+57 ${formatearCelular(digitosDeCelular(p))}`;
import { destinoInterno } from "@/lib/destino";

export function VerifyForm({ phone }: { phone: string }) {
  const router = useRouter();
  const destino = destinoInterno(useSearchParams().get("volver")) ?? "/";
  const [note, setNote] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const [result, submit, pending] = useActionState<OtpResult | null, FormData>(
    async (prev, form) => {
      const res = await verifyCode(prev, form);
      if (!res.error) {
        // El orden importa y costó tres corridas intermitentes averiguarlo.
        // `push` primero navegaba a «/» pudiendo servir la copia en caché que el
        // router tomó ANTES de que existiera la sesión, y entonces la cabecera se
        // dibujaba como si nadie hubiera entrado. Invalidar antes de navegar hace
        // que «/» se pida de nuevo, ya con la cookie puesta.
        router.refresh();
        router.replace(destino);
      }
      return res;
    },
    null,
  );

  // Sin esto, tres clics seguidos mandaban tres códigos: el límite del servidor
  // existe, pero rechazar peticiones que no debieron salir no es lo mismo que no
  // hacerlas.
  const [reenviando, setReenviando] = useState(false);

  async function resend() {
    if (reenviando) return;
    setReenviando(true);
    setNote(null);
    setResendError(null);
    try {
      const res = await sendCode();
      if (res.error) setResendError(res.error);
      else setNote("Te mandamos otro código.");
    } catch {
      setResendError("No pudimos mandar el código. Revisa tu conexión.");
    } finally {
      setReenviando(false);
    }
  }

  return (
    <form action={submit} className="flex flex-col gap-4">
      {(result?.error || resendError) && (
        <ErrorNote>{result?.error || resendError}</ErrorNote>
      )}
      {note && (
        <p
          role="status"
          className="rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand"
        >
          {note}
        </p>
      )}

      <CampoCodigo
        id="code"
        name="code"
        required
        hint={`Lo mandamos al ${mostrarCelular(phone)}. Vence en ${CODIGO_VALIDO_MINUTOS} minutos.`}
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Confirmando…" : "Confirmar celular"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={resend}
        disabled={reenviando}
        aria-busy={reenviando}
      >
        {reenviando ? "Mandando…" : "No me llegó, mandar otro"}
      </Button>
    </form>
  );
}
