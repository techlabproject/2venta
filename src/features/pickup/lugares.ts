import { query } from "@/lib/db";

/**
 * Lugares públicos y concurridos donde encontrarse (corrección 46, D-125): centros
 * comerciales, bibliotecas públicas. La lista vive en la base (migración 0028) para
 * que el equipo la mantenga sin tocar el código; la inicial está «por confirmar».
 */
export type LugarDeEncuentro = { id: string; zona: string; nombre: string; tipo: string };

export function listarLugares(): Promise<LugarDeEncuentro[]> {
  return query<LugarDeEncuentro>(
    `select id, zona, nombre, tipo from lugares_encuentro where activo order by zona, nombre`,
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** El lugar, solo si existe, está activo y es de esa zona. */
export async function lugarDeLaZona(id: string, zona: string): Promise<LugarDeEncuentro | null> {
  if (!UUID.test(id)) return null;
  const rows = await query<LugarDeEncuentro>(
    `select id, zona, nombre, tipo from lugares_encuentro where id = $1 and zona = $2 and activo`,
    [id, zona],
  );
  return rows[0] ?? null;
}

export async function lugarPorId(id: string | null): Promise<LugarDeEncuentro | null> {
  if (!id) return null;
  const rows = await query<LugarDeEncuentro>(
    `select id, zona, nombre, tipo from lugares_encuentro where id = $1`,
    [id],
  );
  return rows[0] ?? null;
}
