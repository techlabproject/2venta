"use server";

import { redirect } from "next/navigation";
import { activeUser } from "@/lib/session";
import { kycProvider } from "./provider";
import { startVerification } from "./queries";

// Acción de servidor: el usuario sobre el que actúa sale de la cookie de sesión,
// nunca de un campo del formulario. Si viniera del formulario, cualquiera podría
// iniciar la verificación de otra persona.
export async function beginVerification(form: FormData) {
  const user = await activeUser();

  // Art. 6 de la Ley 1581: la selfie es un dato biométrico y necesita una
  // autorización explícita y aparte. El `required` de la casilla es comodidad; esto
  // es el control (corrección 11).
  if (form.get("autorizoBiometricos") !== "si") redirect("/vender?autorizacion=falta");

  // D-01: el celular verificado es la base de todo lo demás. Sin esta comprobación
  // alguien podía saltarse el código por SMS y aun así verificar identidad y
  // publicar, que es justo lo que la decisión existe para impedir.
  if (!user.phoneNumberVerified) redirect("/verificar");

  const { reference, redirectUrl } = await kycProvider.start(user.id);
  await startVerification(user.id, kycProvider.name, reference);
  redirect(redirectUrl);
}
