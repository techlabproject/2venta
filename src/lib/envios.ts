import { query } from "./db";

/**
 * El registro de cada código enviado (D-117, D-120): por qué canal, a qué celular y
 * en qué quedó según avisa el proveedor. Nunca el código.
 */

export type Canal = "whatsapp" | "sms";
export type MotivoDelEnvio = "registro" | "recuperacion" | "otro";
export type EstadoDelEnvio = "sent" | "delivered" | "read" | "failed";

export async function anotarEnvio(envio: {
  mensajeId: string;
  telefono: string;
  motivo: MotivoDelEnvio;
  canal: Canal;
}): Promise<void> {
  await query(
    `insert into envios_codigo (mensaje_id, telefono, motivo, canal) values ($1, $2, $3, $4)
     on conflict (mensaje_id) do nothing`,
    [envio.mensajeId, envio.telefono, envio.motivo, envio.canal],
  );
}

/**
 * Lo que avisa el proveedor. Llega repetido y en desorden, así que un estado nunca
 * retrocede («leído» no vuelve a «enviado»), y `failed` gana siempre: un mensaje que
 * falló no llegó, aunque antes haya dicho «enviado». Un id que no es nuestro no
 * actualiza nada.
 */
export async function actualizarEnvio(
  mensajeId: string,
  estado: EstadoDelEnvio,
  error: string | null,
): Promise<void> {
  const orden = { sent: 1, delivered: 2, read: 3, failed: 4 }[estado];
  await query(
    `update envios_codigo
        set estado = $2, error = coalesce($3, error), updated_at = now()
      where mensaje_id = $1
        and (case estado when 'aceptado' then 0 when 'sent' then 1 when 'delivered' then 2
                         when 'read' then 3 when 'failed' then 4 end) < $4`,
    [mensajeId, estado, error, orden],
  );
}
