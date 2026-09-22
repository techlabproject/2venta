import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/ui";
import { VerifyForm } from "@/features/auth/VerifyForm";
import { PhoneForm } from "@/features/auth/PhoneForm";
import { currentUser } from "@/lib/session";
import { conVolver, destinoInterno } from "@/lib/destino";

// D-01: sin celular verificado no se compra ni se escribe. El número verificado es
// lo que impide crear cuentas desechables para estafar y volver a entrar.
export const dynamic = "force-dynamic";

export default async function Verificar({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string }>;
}) {
  const volver = destinoInterno((await searchParams).volver);
  const user = await currentUser();
  if (!user) redirect(conVolver("/ingresar", volver));

  // Ya confirmado: no hay nada que hacer aquí; se sigue a donde iba.
  if (user.phoneNumberVerified) redirect(volver ?? "/");

  // Quien entró con Google llega sin número, porque Google trae correo y no
  // celular. Primero hay que pedírselo.
  const needsPhone = !user.phoneNumber;

  return (
    <AuthShell
      title={needsPhone ? "Falta tu celular" : "Confirma tu celular"}
      subtitle={
        needsPhone
          ? "Google nos dio tu correo, pero no tu número. Lo necesitamos para que puedas comprar y escribirle a un vendedor."
          : "Es lo que evita que alguien estafe y vuelva a entrar con otra cuenta."
      }
    >
      <Suspense fallback={null}>
        {needsPhone ? <PhoneForm /> : <VerifyForm phone={user.phoneNumber!} />}
      </Suspense>
    </AuthShell>
  );
}
