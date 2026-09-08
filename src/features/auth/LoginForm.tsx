"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button, ErrorNote, Field } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const form = new FormData(e.currentTarget);
    const res = await authClient.signIn.email({
      email: String(form.get("email")).trim().toLowerCase(),
      password: String(form.get("password")),
    });

    if (res.error) {
      // No se distingue entre "ese correo no existe" y "esa contraseña no es":
      // hacerlo le confirma a un atacante qué correos están registrados.
      setError(
        res.error.code === "ACCOUNT_SUSPENDED"
          ? "Esta cuenta está suspendida. Escríbenos si crees que es un error."
          : res.error.code === "TOO_MANY_REQUESTS"
            ? "Demasiados intentos. Espera un momento y vuelve a probar."
            : "Correo o contraseña incorrectos."
      );
      setBusy(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Field id="email" name="email" type="email" label="Correo" autoComplete="email" required />
      <Field id="password" name="password" type="password" label="Contraseña"
        autoComplete="current-password" required />
      <Button type="submit" disabled={busy}>
        {busy ? "Entrando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
