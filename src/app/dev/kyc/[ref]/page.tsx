import { notFound } from "next/navigation";
import { isProduction } from "@/lib/env";
import { DevKycControls } from "@/features/kyc/DevKycControls";

// Pantalla del proveedor de prueba. Existe solo mientras R-02 no tenga respuesta:
// ocupa el lugar donde el proveedor real mostraría su propio flujo de captura de
// cédula y selfie. No existe fuera de desarrollo.
export const dynamic = "force-dynamic";

export default async function DevKyc({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  if (isProduction()) notFound();
  const { ref } = await params;

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      {/* Fila 66 (D-129): la referencia interna confundía; se explica qué es esto. */}
      <p className="rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">
        Esta pantalla es una simulación. Cuando 2venta tenga proveedor de
        identidad, aquí vas a tomarte la selfie y la foto de la cédula.
      </p>
      <h1 className="mt-6 font-title text-2xl font-semibold">
        Verificación de identidad
      </h1>
      <DevKycControls reference={ref} />
    </main>
  );
}
