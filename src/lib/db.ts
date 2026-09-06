import { Pool } from "pg";

// Una sola piscina de conexiones por proceso. En desarrollo Next recarga los
// módulos en caliente, así que se guarda en globalThis para no abrir una nueva
// en cada recarga y agotar las conexiones de Postgres.
const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
