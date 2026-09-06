"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { kycProvider } from "./provider";
import { startVerification } from "./queries";

// Acción de servidor: el usuario sobre el que actúa sale de la cookie de sesión,
// nunca de un campo del formulario. Si viniera del formulario, cualquiera podría
// iniciar la verificación de otra persona.
export async function beginVerification() {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const { reference, redirectUrl } = await kycProvider.start(user.id);
  await startVerification(user.id, kycProvider.name, reference);
  redirect(redirectUrl);
}
