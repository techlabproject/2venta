import Link from "next/link";
import { AuthShell } from "@/components/ui";
import { RecoveryForm } from "@/features/auth/RecoveryForm";

// RF-04. Se recupera por celular y no por correo: el celular está verificado y el
// correo no. Mandar la recuperación a un correo que nadie comprobó convertiría ese
// correo en la llave real de la cuenta.
export default function Recuperar() {
  return (
    <AuthShell
      title="Recuperar tu cuenta"
      subtitle="Te mandamos un código al celular que confirmaste al registrarte."
    >
      <RecoveryForm />
      <p className="text-center text-sm text-ink2">
        <Link href="/ingresar" className="font-medium text-brand underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}
