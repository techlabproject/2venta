import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export type SessionUser = {
  id: string;
  name: string;
  alias: string | null;
  phoneNumber: string | null;
  phoneNumberVerified: boolean | null;
  role: string | null;
  suspendedAt: Date | null;
};

/** Solo para pantallas de administración. Se comprueba en el servidor, siempre. */
export async function currentAdmin(): Promise<SessionUser | null> {
  const user = await currentUser();
  return user?.role === "admin" ? user : null;
}

// Punto único para leer la sesión desde el servidor. Ninguna pantalla debe
// deducir quién es el usuario de otra forma: la cookie se valida aquí.
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return (session?.user as SessionUser | undefined) ?? null;
}

/**
 * El usuario de la sesión, solo si su cuenta está activa.
 *
 * Lo usan todas las acciones que escriben. Una cuenta suspendida puede seguir
 * viendo su cuenta y sus pedidos —si tiene dinero retenido en una disputa, dejarla
 * ciega sería quitarle la única forma de defenderse— pero no puede hacer nada
 * nuevo: ni comprar, ni escribir, ni ofertar, ni publicar, ni reportar.
 *
 * Antes esto no existía y suspender no servía para nada más que esconder el
 * catálogo del suspendido.
 */
export async function activeUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");
  if (user.suspendedAt) redirect("/suspendida");
  return user;
}
