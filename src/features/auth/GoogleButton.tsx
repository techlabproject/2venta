"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button, ErrorNote } from "@/components/ui";

// Entrar con Google no exime del celular verificado (D-01): trae correo, no
// número. Después de volver de Google, la app manda a confirmar el celular, y
// hasta que eso pase la cuenta no puede comprar, escribir ni publicar.
export function GoogleButton({
  label = "Continuar con Google",
}: {
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const res = await authClient.signIn.social({
              provider: "google",
              callbackURL: "/verificar",
            });
            if (res?.error) {
              setError("No pudimos conectar con Google. Intenta con tu correo.");
              setBusy(false);
            }
          } catch {
            // Un rechazo del SDK dejaba el botón apagado y mudo.
            setError("No pudimos conectar con Google. Intenta con tu correo.");
            setBusy(false);
          }
        }}
      >
        <GoogleMark />
        {busy ? "Conectando…" : label}
      </Button>
    </>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45 24c0-1.6-.1-2.7-.4-3.9H24v7.1h12c-.2 1.8-1.5 4.6-4.4 6.4l6.7 5.2c4-3.7 6.7-9.1 6.7-14.8z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.8-1.9 14.4-5.2l-6.9-5.3c-1.8 1.3-4.3 2.2-7.5 2.2-5.7 0-10.6-3.8-12.3-9l-7.1 5.5C8.3 41.1 15.6 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.7 28.7c-.5-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2l-7.1-5.5C3.1 17.6 2.3 20.7 2.3 24s.8 6.4 2.3 9.2l7.1-4.5z"
      />
      <path
        fill="#EA4335"
        d="M24 10.7c4 0 6.8 1.7 8.4 3.2l6.1-6C34.7 4.4 29.9 2 24 2 15.6 2 8.3 6.9 4.6 14.8l7.1 5.5c1.7-5.2 6.6-9.6 12.3-9.6z"
      />
    </svg>
  );
}
