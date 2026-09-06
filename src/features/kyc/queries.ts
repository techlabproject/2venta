import { query } from "@/lib/db";

export type KycStatus = "pendiente" | "aprobado" | "rechazado";

export type Verification = {
  user_id: string;
  status: KycStatus;
  reason: string | null;
  reference: string;
};

export async function getVerification(userId: string): Promise<Verification | null> {
  const rows = await query<Verification>(
    `select user_id, status, reason, reference from kyc_verifications where user_id = $1`,
    [userId]
  );
  return rows[0] ?? null;
}

export async function startVerification(
  userId: string,
  provider: string,
  reference: string
): Promise<void> {
  // Reintentar tras un rechazo reemplaza el intento anterior y limpia el motivo.
  await query(
    `insert into kyc_verifications (user_id, provider, reference, status, reason)
     values ($1, $2, $3, 'pendiente', null)
     on conflict (user_id) do update
       set provider = excluded.provider,
           reference = excluded.reference,
           status = 'pendiente',
           reason = null,
           updated_at = now()`,
    [userId, provider, reference]
  );
}

// Devuelve cuántas filas cambió. Cero significa que la referencia no existe, y eso
// es lo que hace que un aviso para un usuario inventado no cree nada.
export async function applyProviderResult(
  reference: string,
  status: KycStatus,
  reason: string | null
): Promise<number> {
  const rows = await query<{ user_id: string }>(
    `update kyc_verifications
        set status = $2, reason = $3, updated_at = now()
      where reference = $1
      returning user_id`,
    [reference, status, reason]
  );
  return rows.length;
}
