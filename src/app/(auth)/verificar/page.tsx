import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/ui";
import { VerifyForm } from "@/features/auth/VerifyForm";
import { PhoneForm } from "@/features/auth/PhoneForm";
import { usuarioSinConfirmar } from "@/lib/session";
import { segundosParaReenviar } from "@/lib/otp-rate-limit";
import { SignOutButton } from "@/features/auth/SignOutButton";
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
  // D-123: aquí se termina el registro, así que sirve la sesión sin confirmar.
  const user = await usuarioSinConfirmar();
  if (!user) redirect(conVolver("/ingresar", volver));

  // Ya confirmado: no hay nada que hacer aquí; se sigue a donde iba.
  if (user.phoneNumberVerified) redirect(volver ?? "/");

  // Quien entró con Google llega sin número, porque Google trae correo y no
  // celular. Primero hay que pedírselo.
  const needsPhone = !user.phoneNumber;
  // 30 s entre códigos: el botón de reenviar arranca con lo que falte del último.
  const espera = user.phoneNumber ? await segundosParaReenviar(user.phoneNumber) : 0;

  return (
    <AuthShell
      title={needsPhone ? "Falta tu celular" : "Confirma tu celular"}
      subtitle={
        needsPhone
          ? "Google nos dio tu correo, pero no tu número. Lo necesitamos para que puedas comprar y escribirle a un vendedor."
          : "Tu cuenta queda creada cuando confirmes el código. Si no lo confirmas en 24 horas, el registro se borra."
      }
    >
      <Suspense fallback={null}>
        {needsPhone ? <PhoneForm /> : <VerifyForm phone={user.phoneNumber!} espera={espera} />}
      </Suspense>
      <p className="text-center text-sm text-ink2">
        ¿Te equivocaste de cuenta?{" "}
        <SignOutButton className="text-brand underline" />
      </p>
    </AuthShell>
  );
}
