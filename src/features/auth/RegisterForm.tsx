"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { sendCode } from "./actions";
import { Button, ErrorNote, Field } from "@/components/ui";
import { CampoCorreo } from "@/components/CampoCorreo";
import { CampoCelular } from "@/components/CampoCelular";
import { normalizarCelular } from "@/lib/celular";
import { PanelLegal } from "@/features/legal/PanelLegal";
import { VERSION_TERMINOS } from "@/features/legal/version";
import { CampoValidado } from "@/components/CampoValidado";
import { hoyEnBogota, problemaDeNacimiento } from "@/lib/edad";
import { conVolver } from "@/lib/destino";

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rol = params.get("rol") === "vendedor" ? "vendedor" : "comprador";
  // Lo que la persona iba a hacer antes de que le pidieran la cuenta. Sigue de
  // largo hasta confirmar el celular (corrección 1, 2026-09-22).
  const volver = params.get("volver");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Corrección 11: se acepta desde el final del panel de términos, no marcando la
  // casilla a ciegas.
  const [aceptado, setAceptado] = useState(false);
  const [terminos, setTerminos] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    if (!aceptado) {
      setError("Para crear tu cuenta, lee y acepta los términos y la política de datos.");
      setTerminos(true);
      setBusy(false);
      return;
    }

    const form = new FormData(e.currentTarget);
    const phone = normalizarCelular(String(form.get("phone")));
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

    // Si el SDK rechaza —red caída, servidor sin responder— antes no se pintaba
    // nada: el formulario se quedaba pensando para siempre con el botón apagado
    // y sin decir por qué (ronda de verificación, 2026-09-20).
    let signUp;
    try {
      signUp = await authClient.signUp.email({
        email: String(form.get("email")).trim().toLowerCase(),
        password: String(form.get("password")),
        name,
        phoneNumber: phone,
        // D-04: el alias es lo público. Por defecto, el nombre y la inicial.
        alias: toAlias(name),
        termsVersion: VERSION_TERMINOS,
        birthDate: String(form.get("birthDate") ?? "").trim(),
      });
    } catch {
      setError("No pudimos conectarnos. Revisa tu conexión e intenta otra vez.");
      setBusy(false);
      return;
    }

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

    // Invalidar antes de navegar (ver VerifyForm).
    router.refresh();
    router.replace(conVolver(`/verificar?rol=${rol}`, volver));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <ErrorNote>
          {error}
          {/* Corrección 13: el celular repetido lleva sus dos salidas a mano. */}
          {/ya tiene una cuenta/.test(error) && (
            <span className="mt-2 flex gap-4">
              <Link href={conVolver("/ingresar", volver)} className="font-medium underline">
                Iniciar sesión
              </Link>
              <Link href="/recuperar" className="font-medium underline">
                Recuperar contraseña
              </Link>
            </span>
          )}
        </ErrorNote>
      )}

      <CampoValidado
        id="name"
        name="name"
        label="Nombre"
        autoComplete="name"
        required
        validar={(v) => (v.trim() ? null : "Escribe tu nombre.")}
        placeholder="Catalina Ríos"
      />
      <CampoCorreo
        id="email"
        name="email"
        label="Correo"
        autoComplete="email"
        required
        placeholder="catalina@correo.com"
      />
      <CampoCelular
        id="phone"
        name="phone"
        label="Celular"
        autoComplete="tel"
        required
        hint="Te mandamos un código para confirmarlo. Sin celular confirmado no puedes comprar ni escribirle a nadie."
      />
      {/* Corrección 11 (art. 52 de la Ley 1480): la «medida posible» para no
          dejar entrar a menores de edad. Decisión de Nicolás. */}
      <CampoValidado
        id="birthDate"
        name="birthDate"
        type="date"
        label="Fecha de nacimiento"
        required
        max={hoyEnBogota()}
        validar={problemaDeNacimiento}
        hint="Para confirmar que eres mayor de edad. No se muestra a nadie."
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
        <input
          type="checkbox"
          name="terms"
          required
          checked={aceptado}
          // Marcarla abre los términos: se acepta desde su final. Desmarcarla sí es
          // directo.
          onChange={(e) => (e.target.checked ? setTerminos(true) : setAceptado(false))}
          className="mt-0.5 size-4 accent-brand"
        />
        <span>
          Leí y acepto los{" "}
          <button
            type="button"
            onClick={() => setTerminos(true)}
            className="font-medium text-brand underline"
          >
            Términos y la Política de datos
          </button>{" "}
          (versión {VERSION_TERMINOS}).
        </span>
      </label>
      <PanelLegal
        abierto={terminos}
        alCerrar={() => setTerminos(false)}
        alAceptar={() => {
          setAceptado(true);
          setTerminos(false);
          setError(null);
        }}
      />

      <Button type="submit" disabled={busy}>
        {busy ? "Creando tu cuenta…" : "Continuar"}
      </Button>
    </form>
  );
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
  // El esquema de better-auth rechaza el correo antes del manejador, con otro
  // código y un mensaje en inglés que menciona el campo (Luna, corrección 6).
  if (/email/i.test(fallback ?? "") && /invalid/i.test(fallback ?? ""))
    return "¡Uy! Ese correo no parece válido. Revisa que se vea como nombre@gmail.com.";

  switch (code) {
    // El servidor revisa el correo aunque la pantalla ya lo haya hecho: esto es lo
    // que ve quien llega con JavaScript a medias (corrección 6).
    case "INVALID_EMAIL":
      return "¡Uy! Ese correo no parece válido. Revisa que se vea como nombre@gmail.com.";
    case "UNDERAGE":
      return "Para usar 2venta debes tener 18 años o más.";
    case "INVALID_BIRTHDATE":
      return "Esa fecha no parece real. Revísala.";
    case "BIRTHDATE_REQUIRED":
      return "Escribe tu fecha de nacimiento.";
    case "TERMS_REQUIRED":
      return "Para crear tu cuenta, lee y acepta los términos y la política de datos.";
    case "NAME_REQUIRED":
      return "Escribe tu nombre.";
    case "PHONE_TAKEN":
      return "¡Uy! Ese celular ya tiene una cuenta. Inicia sesión o recupera tu contraseña.";
    case "INVALID_PHONE":
      return "Ese celular no es válido: son 10 dígitos que empiezan por 3.";
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
      // Corrección 13: lo que no sabemos explicar se dice con calidez y con un
      // código para soporte; los datos escritos se quedan en el formulario.
      return `¡Uy! Algo falló de nuestro lado y no se creó tu cuenta. Intenta de nuevo en un momento.${code ? ` (Código: ${code})` : ""}`;
  }
}
