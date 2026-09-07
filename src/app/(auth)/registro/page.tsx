import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/ui";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { GoogleButton } from "@/features/auth/GoogleButton";
import { googleConfigured } from "@/lib/auth";

// Pantalla 1b del mockup. Aquí no se pide ningún documento: la verificación de
// identidad del vendedor es un paso aparte (S-02, decisión D-02).
export default function Registro() {
  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Con tu correo y tu celular empiezas a explorar. Si vas a vender, el siguiente paso es verificar tu identidad."
    >
      {googleConfigured() && (
        <>
          <GoogleButton label="Crear cuenta con Google" />
          <p className="text-center text-xs text-muted">o con tu correo</p>
        </>
      )}
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
      <p className="text-center text-sm text-ink2">
        Ya tengo cuenta ·{" "}
        <Link href="/ingresar" className="font-medium text-brand underline">
          Iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}
