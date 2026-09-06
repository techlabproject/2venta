import { Suspense } from "react";
import { AuthShell } from "@/components/ui";
import { VerifyForm } from "@/features/auth/VerifyForm";

// D-01: sin celular verificado no se compra ni se escribe. El número verificado es
// lo que impide crear cuentas desechables para estafar y volver a entrar.
export default function Verificar() {
  return (
    <AuthShell
      title="Confirma tu celular"
      subtitle="Es lo que evita que alguien estafe y vuelva a entrar con otra cuenta."
    >
      <Suspense fallback={null}>
        <VerifyForm />
      </Suspense>
    </AuthShell>
  );
}
