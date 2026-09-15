"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { sendCode } from "./actions";
import { Button, ErrorNote, Field } from "@/components/ui";

export function RegisterForm() {
  const router = useRouter();
  const rol =
    useSearchParams().get("rol") === "vendedor" ? "vendedor" : "comprador";

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const form = new FormData(e.currentTarget);
    const phone = normalizePhone(String(form.get("phone")));
    const name = String(form.get("name")).trim();

    // La validación del navegador es comodidad, no control: el servidor vuelve a
    // comprobar todo. Esto solo evita un viaje de ida y vuelta inútil.
    if (!phone) {
      setError(
        "Escribe un celular colombiano de 10 dígitos, por ejemplo 300 412 88 05.",
      );
      setBusy(false);
      return;
    }

    const signUp = await authClient.signUp.email({
      email: String(form.get("email")).trim().toLowerCase(),
      password: String(form.get("password")),
      name,
      phoneNumber: phone,
      // D-04: el alias es lo público. Por defecto, el nombre de pila y la inicial.
      alias: toAlias(name),
    });

    if (signUp.error) {
      setError(translate(signUp.error.code, signUp.error.message));
      setBusy(false);
      return;
    }

    // El código se manda aquí y se espera. Hacerlo después de navegar deja una
    // carrera: la pantalla de verificación puede aparecer antes de que el código
    // exista, y quien lo pide de inmediato no encuentra nada.
    const sent = await sendCode();
    if (sent.error) {
      setError(sent.error);
      setBusy(false);
      return;
    }

    router.push(`/verificar?rol=${rol}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <ErrorNote>{error}</ErrorNote>}

      <Field
        id="name"
        name="name"
        label="Nombre"
        autoComplete="name"
        required
        placeholder="Catalina Ríos"
      />
      <Field
        id="email"
        name="email"
        type="email"
        label="Correo"
        autoComplete="email"
        required
        placeholder="catalina@correo.com"
      />
      <Field
        id="phone"
        name="phone"
        type="tel"
        label="Celular"
        autoComplete="tel"
        required
        placeholder="300 412 88 05"
        hint="Te mandamos un código para confirmarlo. Sin celular confirmado no puedes comprar ni escribirle a nadie."
      />
      <Field
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        autoComplete="new-password"
        required
        minLength={8}
        hint="Mínimo ocho caracteres."
      />

      <label className="flex items-start gap-2.5 text-sm text-ink2">
        <input type="checkbox" name="terms" required className="mt-0.5" />
        <span>Acepto los términos y la política de tratamiento de datos.</span>
      </label>

      <Button type="submit" disabled={busy}>
        {busy ? "Creando tu cuenta…" : "Continuar"}
      </Button>
    </form>
  );
}

// Guardamos el celular en formato internacional para que sea único sin importar
// cómo lo escriba cada quien. Versión 1: solo Colombia (D-06).
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "").replace(/^57/, "");
  return /^3\d{9}$/.test(digits) ? `+57${digits}` : null;
}

function toAlias(name: string): string {
  const [first, ...rest] = name.split(/\s+/).filter(Boolean);
  if (!first) return "Usuario";
  const initial = rest.at(-1)?.[0];
  return initial ? `${first} ${initial.toUpperCase()}.` : first;
}

function translate(code: string | undefined, fallback?: string): string {
  // La biblioteca no siempre trae un código de error legible, así que también se
  // mira el mensaje. Nunca se muestra el texto crudo en inglés al usuario.
  if (/already exists/i.test(fallback ?? ""))
    return "Ese correo ya tiene una cuenta. Inicia sesión o usa otro.";
  if (/demasiados códigos/i.test(fallback ?? "")) return fallback!;

  switch (code) {
    case "USER_ALREADY_EXISTS":
      return "Ese correo ya tiene una cuenta. Inicia sesión o usa otro.";
    case "PASSWORD_TOO_SHORT":
    case "PASSWORD_TOO_WEAK":
      return "La contraseña necesita al menos ocho caracteres que no sean espacios.";
    case "PASSWORD_TOO_LONG":
      return "Esa contraseña es demasiado larga. Usa una más corta.";
    case "TOO_MANY_REQUESTS":
      return "Demasiados intentos. Espera un momento y vuelve a probar.";
    default:
      return "No pudimos crear tu cuenta. Intenta de nuevo.";
  }
}
