"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button, ErrorNote, Field } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  // A dónde volver después de entrar. Quien iba a comprar o a escribirle a un
  // vendedor terminaba en la portada y tenía que buscar el artículo otra vez
  // (hallazgo de la ronda de agentes, 2026-09-13). Solo se admiten rutas de
  // esta misma aplicación: una URL completa aquí sería un salto a otro sitio.
  const volverA = useSearchParams().get("volver");
  const destino =
    volverA?.startsWith("/") && !volverA.startsWith("//") ? volverA : "/";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const form = new FormData(e.currentTarget);
    // Si el SDK rechaza —red caída, servidor sin responder— antes no se pintaba
    // nada: el formulario se quedaba pensando para siempre con el botón apagado
    // y sin decir por qué (ronda de verificación, 2026-09-20).
    let res;
    try {
      res = await authClient.signIn.email({
        email: String(form.get("email")).trim().toLowerCase(),
        password: String(form.get("password")),
      });
    } catch {
      setError("No pudimos conectarnos. Revisa tu conexión e intenta otra vez.");
      setBusy(false);
      return;
    }

    if (res.error) {
      // No se distingue entre "ese correo no existe" y "esa contraseña no es":
      // hacerlo le confirma a un atacante qué correos están registrados.
      setError(
        res.error.code === "ACCOUNT_SUSPENDED"
          ? "Esta cuenta está suspendida. Escríbenos si crees que es un error."
          : res.error.code === "TOO_MANY_REQUESTS"
            ? "Demasiados intentos. Espera un momento y vuelve a probar."
            : "Correo o contraseña incorrectos.",
      );
      setBusy(false);
      return;
    }

    // Invalidar antes de navegar: al revés, el destino podía servirse de la copia
    // en caché tomada sin sesión (ver VerifyForm).
    router.refresh();
    router.push(destino);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Field
        id="email"
        name="email"
        type="email"
        label="Correo"
        autoComplete="email"
        required
      />
      <Field
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        autoComplete="current-password"
        required
      />
      <Button type="submit" disabled={busy}>
        {busy ? "Entrando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
