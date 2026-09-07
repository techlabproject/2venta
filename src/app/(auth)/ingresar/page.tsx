import Link from "next/link";
import { AuthShell } from "@/components/ui";
import { LoginForm } from "@/features/auth/LoginForm";
import { GoogleButton } from "@/features/auth/GoogleButton";
import { googleConfigured } from "@/lib/auth";

export default function Ingresar() {
  return (
    <AuthShell title="Iniciar sesión">
      {googleConfigured() && (
        <>
          <GoogleButton />
          <p className="text-center text-xs text-muted">o con tu correo</p>
        </>
      )}
      <LoginForm />
      <p className="text-center text-sm text-ink2">
        <Link href="/recuperar" className="text-brand underline">
          Olvidé mi contraseña
        </Link>
      </p>
      <p className="text-center text-sm text-ink2">
        ¿No tienes cuenta?{" "}
        <Link href="/bienvenida" className="font-medium text-brand underline">
          Crear una
        </Link>
      </p>
    </AuthShell>
  );
}
