"use client";

import { CODIGO_VALIDO_MINUTOS, ESPERA_PARA_REENVIAR_S } from "./vigencia";

import { useActionState, useState } from "react";
import { useCuentaRegresiva } from "./useCuentaRegresiva";
import { useRouter, useSearchParams } from "next/navigation";
import { cambiarCelular, sendCode, verifyCode, type OtpResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";
import { CampoCodigo } from "@/components/CampoCodigo";
import { CampoCelular } from "@/components/CampoCelular";
import { digitosDeCelular, formatearCelular } from "@/lib/celular";

/** «+573001110003» → «+57 300 111 0003», como se dice en voz alta. */
const mostrarCelular = (p: string) => `+57 ${formatearCelular(digitosDeCelular(p))}`;
import { destinoInterno } from "@/lib/destino";

export function VerifyForm({ phone, espera: esperaInicial }: { phone: string; espera: number }) {
  const router = useRouter();
  const [espera, reiniciarEspera] = useCuentaRegresiva(esperaInicial);
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
      if (res.error) {
        setResendError(res.error);
        if (res.espera) reiniciarEspera(res.espera);
      } else {
        setNote("Te mandamos otro código.");
        reiniciarEspera(ESPERA_PARA_REENVIAR_S);
      }
    } catch {
      setResendError("No pudimos mandar el código. Revisa tu conexión.");
    } finally {
      setReenviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
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
        disabled={reenviando || espera > 0}
        aria-busy={reenviando}
      >
        {reenviando
          ? "Mandando…"
          : espera > 0
            ? `Mandar otro en ${espera} s`
            : "No me llegó, mandar otro"}
      </Button>
    </form>
    <CambiarNumero
      onIntento={() => {
        // Un aviso de antes no puede quedar junto al resultado nuevo (Luna, D-123).
        setNote(null);
        setResendError(null);
      }}
      onCambiado={(res) => {
        setNote(
          res.mismoNumero
            ? "Es el mismo número: te mandamos otro código."
            : "Listo: te mandamos un código al número nuevo.",
        );
        reiniciarEspera(ESPERA_PARA_REENVIAR_S);
        router.refresh();
      }}
    />
    </div>
  );
}

/**
 * D-123: «¿No es tu número?». Corrige el celular sin volver a llenar el registro y
 * manda el código al nuevo.
 */
function CambiarNumero({
  onIntento,
  onCambiado,
}: {
  onIntento: () => void;
  onCambiado: (res: OtpResult) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [result, submit, pending] = useActionState<OtpResult | null, FormData>(
    async (prev, form) => {
      onIntento();
      const res = await cambiarCelular(prev, form);
      if (!res.error) {
        setAbierto(false);
        onCambiado(res);
      }
      return res;
    },
    null,
  );

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-center text-sm text-brand underline"
      >
        ¿No es tu número? Cámbialo
      </button>
    );
  }
  return (
    <form
      action={submit}
      className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-line"
    >
      {result?.error && <ErrorNote>{result.error}</ErrorNote>}
      <CampoCelular
        id="nuevo-celular"
        name="phone"
        label="Tu celular"
        autoComplete="tel"
        required
        hint="Te mandamos un código nuevo a este número."
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Mandando…" : "Mandar código a este número"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
