import { query } from "@/lib/db";

/**
 * Lo que el equipo gestiona desde /admin/configuracion (corrección 52, D-128):
 * categorías, lugares de encuentro, tallas y edades, palabras prohibidas. Lo que lee
 * el resto de la app sale de aquí (solo lo activo); el panel ve todo.
 */

export type OpcionesDeAtributos = {
  tallasLetra: string[];
  tallasNumero: string[];
  edades: string[];
};

/** Las tallas y edades que se pueden elegir al publicar o editar. */
export async function opcionesDeAtributos(): Promise<OpcionesDeAtributos> {
  const rows = await query<{ tipo: string; valor: string; grupo: string | null }>(
    `select tipo, valor, grupo from atributos where activo order by tipo, orden, valor`,
  );
  return {
    tallasLetra: rows.filter((r) => r.tipo === "talla" && r.grupo !== "numero").map((r) => r.valor),
    tallasNumero: rows.filter((r) => r.tipo === "talla" && r.grupo === "numero").map((r) => r.valor),
    edades: rows.filter((r) => r.tipo === "edad").map((r) => r.valor),
  };
}

export async function atributoValido(tipo: "talla" | "edad", valor: string): Promise<boolean> {
  const rows = await query(`select 1 from atributos where tipo = $1 and valor = $2 and activo`, [
    tipo,
    valor,
  ]);
  return rows.length > 0;
}

export async function categoriaActiva(slug: string): Promise<boolean> {
  const rows = await query(`select 1 from categories where slug = $1 and active`, [slug]);
  return rows.length > 0;
}

export type FraseProhibida = { frase: string; motivo: string };

/** Las frases que agregó el equipo, activas. Las usa la moderación al publicar. */
export function frasesProhibidas(): Promise<FraseProhibida[]> {
  return query<FraseProhibida>(
    `select frase, motivo from palabras_prohibidas where activo order by frase`,
  );
}

// ---- Solo para el panel ----------------------------------------------------------

export function todasLasCategorias() {
  return query<{ slug: string; label: string; position: number; active: boolean }>(
    `select slug, label, position, active from categories order by position, slug`,
  );
}

export function todosLosLugares() {
  return query<{
    id: string;
    zona: string;
    nombre: string;
    tipo: string;
    activo: boolean;
    confirmado: boolean;
  }>(`select id, zona, nombre, tipo, activo, confirmado from lugares_encuentro order by zona, nombre`);
}

export function todosLosAtributos() {
  return query<{ tipo: string; valor: string; grupo: string | null; orden: number; activo: boolean }>(
    `select tipo, valor, grupo, orden, activo from atributos order by tipo, orden, valor`,
  );
}

export function todasLasPalabras() {
  return query<{ id: string; frase: string; motivo: string; activo: boolean }>(
    `select id, frase, motivo, activo from palabras_prohibidas order by activo desc, frase`,
  );
}

export function ultimosCambios(limite = 50) {
  return query<{
    entidad: string;
    clave: string;
    antes: unknown;
    despues: unknown;
    creado: Date;
    quien: string;
  }>(
    `select c.entidad, c.clave, c.antes, c.despues, c.creado, coalesce(u.name, u.alias) as quien
       from cambios_config c join "user" u on u.id = c.admin_id
      order by c.creado desc limit $1`,
    [limite],
  );
}

/** Deja el cambio en el historial: quién, qué, qué había y qué quedó. */
export async function anotarCambio(
  adminId: string,
  entidad: string,
  clave: string,
  antes: unknown,
  despues: unknown,
): Promise<void> {
  await query(
    `insert into cambios_config (admin_id, entidad, clave, antes, despues)
     values ($1, $2, $3, $4::jsonb, $5::jsonb)`,
    [adminId, entidad, clave, JSON.stringify(antes ?? null), JSON.stringify(despues ?? null)],
  );
}
