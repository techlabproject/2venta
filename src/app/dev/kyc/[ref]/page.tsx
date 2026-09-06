import { notFound } from "next/navigation";
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
  if (process.env.NODE_ENV === "production") notFound();
  const { ref } = await params;

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <p className="rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">
        Proveedor de verificación de prueba. Ocupa el lugar del proveedor real
        mientras se decide cuál será (R-02). No existe en producción.
      </p>
      <h1 className="mt-6 font-title text-2xl font-semibold">
        Verificación de identidad
      </h1>
      <p className="mt-2 text-sm text-ink2">
        Referencia <code>{ref}</code>
      </p>
      <DevKycControls reference={ref} />
    </main>
  );
}
