import { query } from "@/lib/db";

/**
 * Quién vende y cómo notificarlo (corrección 15; art. 53 de la Ley 1480).
 *
 * Se llena al empezar a vender, antes de verificar la identidad. Quien ya vendía
 * antes de la corrección no lo tiene: `/vender` le pide completarlo.
 */
export type Vendedor = {
  user_id: string;
  tipo: "natural" | "juridica";
  direccion_notificaciones: string;
  telefono: string;
};

export async function getVendedor(userId: string): Promise<Vendedor | null> {
  const rows = await query<Vendedor>(
    `select user_id, tipo, direccion_notificaciones, telefono from vendedores where user_id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

/** La persona jurídica vigente de esta cuenta, si la hay (no archivada). */
export type Juridica = {
  legal_name: string;
  nit: string;
  representante_nombre: string | null;
  nit_confirmado_at: Date | null;
};

export async function getJuridica(userId: string): Promise<Juridica | null> {
  const rows = await query<Juridica>(
    `select legal_name, nit, representante_nombre, nit_confirmado_at
       from stores where user_id = $1 and archivada_at is null`,
    [userId],
  );
  return rows[0] ?? null;
}

/**
 * ¿La cuenta vende como persona jurídica? (corrección 17). Cuenta desde que la
 * elige, aunque el NIT todavía no esté confirmado: lo que se evita es la compra de
 * una empresa, no la insignia.
 */
export async function esEmpresa(userId: string): Promise<boolean> {
  const rows = await query<{ tipo: string }>(
    `select tipo from vendedores where user_id = $1`,
    [userId],
  );
  return rows[0]?.tipo === "juridica";
}
