import Link from "next/link";
import { AuthShell } from "@/components/ui";
import { LoginForm } from "@/features/auth/LoginForm";

export default function Ingresar() {
  return (
    <AuthShell title="Iniciar sesión">
      <LoginForm />
      <p className="text-center text-sm text-ink2">
        ¿No tienes cuenta?{" "}
        <Link href="/bienvenida" className="font-medium text-brand underline">
          Crear una
        </Link>
      </p>
    </AuthShell>
  );
}
