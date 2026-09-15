import Link from "next/link";
import { AuthShell } from "@/components/ui";
import { LoginForm } from "@/features/auth/LoginForm";
import { GoogleButton } from "@/features/auth/GoogleButton";
import { googleConfigured } from "@/lib/auth";

const MOTIVO: Record<string, string> = {
  comprar:
    "Entra para comprar con pago protegido. Tu plata queda guardada hasta que confirmes que recibiste.",
  chat: "Entra para escribirle al vendedor. Las conversaciones van dentro de 2venta para que el pago siga protegido.",
  favoritos: "Entra para guardar lo que te gusta y volver después.",
};

export default async function Ingresar({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string; motivo?: string }>;
}) {
  // Se dice por qué se pide la cuenta: antes se caía en esta pantalla sin
  // explicación, y quien venía de un artículo no sabía por qué se la pedían.
  const { motivo } = await searchParams;
  const razon = motivo ? MOTIVO[motivo] : undefined;

  return (
    <AuthShell title="Iniciar sesión" subtitle={razon}>
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
