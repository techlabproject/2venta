"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button, ErrorNote, Field } from "@/components/ui";

export function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("tel") ?? "";
  const rol = params.get("rol") === "vendedor" ? "vendedor" : "comprador";

  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const code = String(new FormData(e.currentTarget).get("code")).replace(/\D/g, "");
    const res = await authClient.phoneNumber.verify({ phoneNumber: phone, code });

    if (res.error) {
      setError(translate(res.error.code, res.error.message));
      setBusy(false);
      return;
    }

    // El vendedor sigue a verificar identidad (S-02); el comprador ya puede usar
    // la app. Mientras S-02 no exista, ambos caen en el catálogo.
    router.push(rol === "vendedor" ? "/?rol=vendedor" : "/");
    router.refresh();
  }

  async function resend() {
    setError(null);
    setNote(null);
    const res = await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
    if (res.error) setError(translate(res.error.code, res.error.message));
    else setNote("Te mandamos otro código.");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <ErrorNote>{error}</ErrorNote>}
      {note && (
        <p role="status" className="rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand">
          {note}
        </p>
      )}

      <Field
        id="code"
        name="code"
        label="Código de seis dígitos"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        placeholder="000000"
        hint={`Lo mandamos al ${phone}. Vence en cinco minutos.`}
      />

      <Button type="submit" disabled={busy}>
        {busy ? "Confirmando…" : "Confirmar celular"}
      </Button>

      <Button type="button" variant="ghost" onClick={resend}>
        No me llegó, mandar otro
      </Button>
    </form>
  );
}

function translate(code: string | undefined, fallback?: string): string {
  // La biblioteca no siempre trae un código de error legible, así que también se
  // mira el mensaje. Nunca se muestra el texto crudo en inglés al usuario.
  if (/already exists/i.test(fallback ?? ""))
    return "Ese correo ya tiene una cuenta. Inicia sesión o usa otro.";
  if (/demasiados códigos/i.test(fallback ?? "")) return fallback!;

  switch (code) {
    case "INVALID_OTP":
    case "OTP_NOT_FOUND":
      return "Ese código no es. Revísalo y vuelve a intentar.";
    case "OTP_EXPIRED":
      return "El código venció. Pide uno nuevo.";
    case "TOO_MANY_ATTEMPTS":
    case "TOO_MANY_REQUESTS":
      return "Demasiados intentos. Espera un momento antes de volver a probar.";
    default:
      return "No pudimos confirmar el código.";
  }
}
