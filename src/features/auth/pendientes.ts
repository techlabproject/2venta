import { query } from "@/lib/db";

/**
 * Registros sin terminar (D-123): la cuenta nace pendiente y solo existe de verdad
 * cuando se confirma el celular (lo marca el disparador `terminar_registro`,
 * migración 0026).
 */

export const HORAS_PARA_CONFIRMAR = 24;

/**
 * Borra los registros que nadie confirmó a tiempo. El correo y el celular quedan
 * libres. Lo corre el trabajo de cada hora y, por si acaso, cada registro nuevo.
 * Sesiones y credenciales se van con la cuenta (`on delete cascade`).
 */
export async function borrarPendientesVencidos(): Promise<number> {
  const rows = await query<{ id: string }>(
    `delete from "user"
      where registro_pendiente_desde is not null
        and not "phoneNumberVerified"
        and registro_pendiente_desde < now() - ($1 || ' hours')::interval
      returning id`,
    [String(HORAS_PARA_CONFIRMAR)],
  );
  return rows.length;
}

/**
 * Un registro nuevo con el mismo correo reemplaza al pendiente (decisión de
 * Nicolás): sirve a quien se equivocó y a quien le «apartaron» su correo. Quien
 * confirma el celular es quien se queda con la cuenta. Una cuenta confirmada nunca
 * se toca.
 */
export async function reemplazarPendiente(email: string): Promise<void> {
  await query(
    `delete from "user"
      where email = $1 and registro_pendiente_desde is not null and not "phoneNumberVerified"`,
    [email.trim().toLowerCase()],
  );
}
