import { headers } from "next/headers";
import { auth } from "./auth";

export type SessionUser = {
  id: string;
  name: string;
  alias: string | null;
  phoneNumber: string | null;
  phoneNumberVerified: boolean | null;
};

// Punto único para leer la sesión desde el servidor. Ninguna pantalla debe
// deducir quién es el usuario de otra forma: la cookie se valida aquí.
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return (session?.user as SessionUser | undefined) ?? null;
}
