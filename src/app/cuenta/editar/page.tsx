import Link from "next/link";
import { activeUser } from "@/lib/session";
import { query } from "@/lib/db";
import { ProfileForm } from "@/features/profile/Forms";
import { AppHeader } from "@/components/AppHeader";

// RF-12. Editar el propio perfil.
export const dynamic = "force-dynamic";

export default async function EditarPerfil() {
  // Una cuenta suspendida no llega a las pantallas que escriben.
  const user = await activeUser();

  const rows = await query<{ zone: string | null; bio: string | null }>(
    `select zone, bio from "user" where id = $1`,
    [user.id]
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <Link href="/cuenta" className="text-sm text-ink2 underline">
          Volver a tu cuenta
        </Link>
        <h1 className="mt-4 font-title text-xl font-semibold">Editar tu perfil</h1>
        <ProfileForm
          alias={user.alias ?? user.name}
          zone={rows[0]?.zone ?? null}
          bio={rows[0]?.bio ?? null}
        />
      </main>
    </>
  );
}
