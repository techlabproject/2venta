"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { sendCode, verifyCode, type OtpResult } from "./actions";
import { Button, ErrorNote, Field } from "@/components/ui";

export function VerifyForm({ phone }: { phone: string }) {
  const router = useRouter();
  const [note, setNote] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const [result, submit, pending] = useActionState<OtpResult | null, FormData>(
    async (prev, form) => {
      const res = await verifyCode(prev, form);
      if (!res.error) {
        router.push("/");
        router.refresh();
      }
      return res;
    },
    null,
  );

  async function resend() {
    setNote(null);
    setResendError(null);
    const res = await sendCode();
    if (res.error) setResendError(res.error);
    else setNote("Te mandamos otro código.");
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

      <Button type="submit" disabled={pending}>
        {pending ? "Confirmando…" : "Confirmar celular"}
      </Button>

      <Button type="button" variant="ghost" onClick={resend}>
        No me llegó, mandar otro
      </Button>
    </form>
  );
}
