import { activeUser } from "@/lib/session";
import { query } from "@/lib/db";
import { ProfileForm } from "@/features/profile/Forms";
import { AvatarForm } from "@/features/profile/AvatarForm";
import { Avatar } from "@/components/Avatar";
import { mediaUrl } from "@/lib/media";
import { AppHeader } from "@/components/AppHeader";
import { Volver } from "@/components/Volver";

// RF-12. Editar el propio perfil.
export const dynamic = "force-dynamic";

export default async function EditarPerfil() {
  // Una cuenta suspendida no llega a las pantallas que escriben.
  const user = await activeUser();

  const rows = await query<{
    zone: string | null;
    bio: string | null;
    avatar_path: string | null;
  }>(`select zone, bio, avatar_path from "user" where id = $1`, [user.id]);
  const alias = user.alias ?? user.name;
  const foto = rows[0]?.avatar_path ? mediaUrl(rows[0].avatar_path) : null;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <Volver href="/cuenta" fijo>Volver a tu cuenta</Volver>
        <h1 className="mt-4 font-title text-xl font-semibold">
          Editar tu perfil
        </h1>

        {/* La foto es lo primero: en un mercado de desconocidos, una cara cambia
            más que cualquier texto de la descripción. */}
        <section className="mt-5 rounded-2xl bg-white shadow-xs p-5 ring-1 ring-line">
          <div className="flex items-center gap-4">
            <Avatar src={foto} name={alias} size="lg" />
            <div className="min-w-0 flex-1">
              <h2 className="font-title font-semibold">Tu foto</h2>
              <p className="text-sm text-muted">Así te ven los demás.</p>
            </div>
          </div>
          <div className="mt-4">
            <AvatarForm tieneFoto={Boolean(foto)} />
          </div>
        </section>

        <ProfileForm
          alias={user.alias ?? user.name}
          zone={rows[0]?.zone ?? null}
          bio={rows[0]?.bio ?? null}
        />
      </main>
    </>
  );
}
