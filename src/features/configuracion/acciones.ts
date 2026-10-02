"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/session";
import { query } from "@/lib/db";
import { hasContact } from "@/features/chat/redact";
import { zonaReconocida } from "@/features/ubicacion/zonas";
import { anotarCambio } from "./queries";

/**
 * El panel de configuración del equipo (corrección 52, D-128). Cada acción comprueba
 * en el servidor que quien la llama es del equipo: esconder la página no es control
 * de nada. Y cada cambio queda en el historial con lo que había antes.
 *
 * Son formularios de servidor: funcionan sin JavaScript. Un error vuelve a la página
 * con un código (`?error=`), nunca con datos de nadie.
 */

const PANEL = "/admin/configuracion";

async function equipo() {
  const admin = await currentAdmin();
  if (!admin) notFound();
  return admin;
}

function volver(seccion: string, error?: string): never {
  // Siempre se invalida el panel: dos cambios seguidos vuelven a la misma dirección
  // (`?listo=1`) y, sin esto, el navegador mostraba la versión de antes del segundo
  // (una palabra agregada después de borrar un lugar no aparecía).
  revalidatePath(PANEL);
  // Vuelve a la pestaña de la sección (D-130, decisión 7).
  redirect(error ? `${PANEL}?seccion=${seccion}&error=${error}` : `${PANEL}?seccion=${seccion}&listo=1`);
}

function refrescarTodo() {
  // Categorías, lugares y tallas se ven en toda la app.
  revalidatePath("/", "layout");
}

/**
 * El texto del campo, sin espacios de más. Si pasa del máximo se rechaza con «largo»
 * en vez de recortarlo sin avisar (Luna, fila 52).
 */
function texto(form: FormData, campo: string, max: number, seccion?: string): string {
  const valor = String(form.get(campo) ?? "").trim().replace(/\s+/g, " ");
  if (seccion && valor.length > max) volver(seccion, "largo");
  return valor.slice(0, max);
}

// ---- Categorías ------------------------------------------------------------------

export async function guardarCategoria(form: FormData): Promise<void> {
  const admin = await equipo();
  const slug = texto(form, "slug", 40);
  const label = texto(form, "label", 40, "categorias");
  const position = Number(form.get("position"));
  const active = form.get("active") === "on";
  if (label.length < 2 || hasContact(label)) volver("categorias", "nombre");
  if (!Number.isInteger(position) || position < 0 || position > 999) volver("categorias", "orden");

  const antes = await query(`select label, position, active from categories where slug = $1`, [slug]);
  if (!antes[0]) volver("categorias", "no-existe");
  // Al menos una categoría activa: sin ninguna, no se podría publicar nada.
  if (!active) {
    const otras = await query(`select 1 from categories where active and slug <> $1`, [slug]);
    if (!otras.length) volver("categorias", "ultima");
  }
  await query(`update categories set label = $2, position = $3, active = $4 where slug = $1`, [
    slug,
    label,
    position,
    active,
  ]);
  await anotarCambio(admin.id, "categoria", slug, antes[0], { label, position, active });
  refrescarTodo();
  volver("categorias");
}

/** La dirección corta de una categoría nueva, a partir de su nombre: «Artículos de hogar» → «articulos-de-hogar». */
function slugDe(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// Fila 57 (D-129): el equipo crea categorías. Nacen activas, al final del orden.
export async function agregarCategoria(form: FormData): Promise<void> {
  const admin = await equipo();
  const label = texto(form, "label", 40, "categorias");
  if (label.length < 2 || hasContact(label)) volver("categorias", "nombre");
  const slug = slugDe(label);
  if (slug.length < 2) volver("categorias", "nombre");
  const rows = await query<{ slug: string }>(
    `insert into categories (slug, label, position, active)
     values ($1, $2, (select coalesce(max(position), 0) + 1 from categories), true)
     on conflict do nothing returning slug`,
    [slug, label],
  );
  if (!rows[0]) volver("categorias", "repetido");
  await anotarCambio(admin.id, "categoria", slug, null, { label, active: true });
  refrescarTodo();
  volver("categorias");
}

// Fila 58 (D-129): se borra solo lo que ninguna publicación usa. La base lo vuelve a
// impedir (la publicación apunta a la categoría), pero el aviso tiene que ser claro.
export async function borrarCategoria(form: FormData): Promise<void> {
  const admin = await equipo();
  const slug = texto(form, "slug", 40);
  const antes = await query<{ label: string; active: boolean; usos: number }>(
    `select label, active, (select count(*) from listings l where l.category = c.slug)::int as usos
       from categories c where slug = $1`,
    [slug],
  );
  if (!antes[0]) volver("categorias", "no-existe");
  if (antes[0].usos > 0) volver("categorias", "en-uso");
  if (antes[0].active) {
    const otras = await query(`select 1 from categories where active and slug <> $1`, [slug]);
    if (!otras.length) volver("categorias", "ultima");
  }
  try {
    await query(`delete from categories where slug = $1`, [slug]);
  } catch {
    volver("categorias", "en-uso");
  }
  await anotarCambio(admin.id, "categoria", slug, { label: antes[0].label }, null);
  refrescarTodo();
  volver("categorias");
}

// ---- Lugares de encuentro --------------------------------------------------------

const TIPOS_DE_LUGAR = ["centro_comercial", "biblioteca", "parque", "museo"];

export async function guardarLugar(form: FormData): Promise<void> {
  const admin = await equipo();
  const id = texto(form, "id", 40);
  const nombre = texto(form, "nombre", 80, "lugares");
  const tipo = texto(form, "tipo", 20);
  const activo = form.get("activo") === "on";
  const confirmado = form.get("confirmado") === "on";
  if (nombre.length < 3 || hasContact(nombre)) volver("lugares", "nombre");
  if (!TIPOS_DE_LUGAR.includes(tipo)) volver("lugares", "tipo");

  const antes = await query(
    `select zona, nombre, tipo, activo, confirmado from lugares_encuentro where id::text = $1`,
    [id],
  );
  if (!antes[0]) volver("lugares", "no-existe");
  try {
    await query(
      `update lugares_encuentro set nombre = $2, tipo = $3, activo = $4, confirmado = $5
        where id::text = $1`,
      [id, nombre, tipo, activo, confirmado],
    );
  } catch {
    volver("lugares", "repetido");
  }
  await anotarCambio(admin.id, "lugar", id, antes[0], { nombre, tipo, activo, confirmado });
  refrescarTodo();
  volver("lugares");
}

export async function agregarLugar(form: FormData): Promise<void> {
  const admin = await equipo();
  const zona = zonaReconocida(texto(form, "zona", 40));
  const nombre = texto(form, "nombre", 80, "lugares");
  const tipo = texto(form, "tipo", 20);
  if (!zona) volver("lugares", "zona");
  if (nombre.length < 3 || hasContact(nombre)) volver("lugares", "nombre");
  if (!TIPOS_DE_LUGAR.includes(tipo)) volver("lugares", "tipo");

  // Lo agrega alguien del equipo que lo conoce: nace confirmado.
  const rows = await query<{ id: string }>(
    `insert into lugares_encuentro (zona, nombre, tipo, confirmado) values ($1, $2, $3, true)
     on conflict (zona, nombre) do nothing returning id`,
    [zona.nombre, nombre, tipo],
  );
  if (!rows[0]) volver("lugares", "repetido");
  await anotarCambio(admin.id, "lugar", rows[0].id, null, { zona: zona.nombre, nombre, tipo });
  refrescarTodo();
  volver("lugares");
}

export async function borrarLugar(form: FormData): Promise<void> {
  const admin = await equipo();
  const id = texto(form, "id", 40);
  const antes = await query<{ zona: string; nombre: string; usos: number }>(
    `select zona, nombre, (select count(*) from orders o where o.meeting_place_id = l.id)::int as usos
       from lugares_encuentro l where id::text = $1`,
    [id],
  );
  if (!antes[0]) volver("lugares", "no-existe");
  if (antes[0].usos > 0) volver("lugares", "en-uso");
  try {
    await query(`delete from lugares_encuentro where id::text = $1`, [id]);
  } catch {
    volver("lugares", "en-uso");
  }
  await anotarCambio(admin.id, "lugar", id, { zona: antes[0].zona, nombre: antes[0].nombre }, null);
  refrescarTodo();
  volver("lugares");
}

// ---- Tallas y edades -------------------------------------------------------------

export async function alternarAtributo(form: FormData): Promise<void> {
  const admin = await equipo();
  const tipo = texto(form, "tipo", 10);
  const valor = texto(form, "valor", 30);
  const activo = form.get("activo") === "1";
  const antes = await query<{ activo: boolean }>(
    `select activo from atributos where tipo = $1 and valor = $2`,
    [tipo, valor],
  );
  if (!antes[0]) volver("atributos", "no-existe");
  // Al menos una opción por lista: sin ninguna, no se podría publicar ropa ni
  // artículos para niños.
  if (!activo) {
    const otras = await query(`select 1 from atributos where tipo = $1 and activo and valor <> $2`, [
      tipo,
      valor,
    ]);
    if (!otras.length) volver("atributos", "ultima");
  }
  await query(`update atributos set activo = $3 where tipo = $1 and valor = $2`, [tipo, valor, activo]);
  await anotarCambio(admin.id, tipo, valor, antes[0], { activo });
  refrescarTodo();
  volver("atributos");
}

export async function agregarAtributo(form: FormData): Promise<void> {
  const admin = await equipo();
  const tipo = texto(form, "tipo", 10);
  const valor = texto(form, "valor", 30, "atributos");
  if (tipo !== "talla" && tipo !== "edad") volver("atributos", "tipo");
  if (!valor || hasContact(valor)) volver("atributos", "valor");
  const grupo = tipo === "talla" ? (/^\d+$/.test(valor) ? "numero" : "letra") : null;
  const rows = await query<{ valor: string }>(
    `insert into atributos (tipo, valor, grupo, orden)
     values ($1, $2, $3, (select coalesce(max(orden), 0) + 1 from atributos where tipo = $1))
     on conflict do nothing returning valor`,
    [tipo, valor, grupo],
  );
  if (!rows[0]) volver("atributos", "repetido");
  await anotarCambio(admin.id, tipo, valor, null, { valor, activo: true });
  refrescarTodo();
  volver("atributos");
}

export async function borrarAtributo(form: FormData): Promise<void> {
  const admin = await equipo();
  const tipo = texto(form, "tipo", 10);
  const valor = texto(form, "valor", 30);
  const antes = await query<{ activo: boolean; usos: number }>(
    `select a.activo, (select count(*) from listings l
              where (a.tipo = 'talla' and l.talla = a.valor) or (a.tipo = 'edad' and l.edad = a.valor))::int as usos
       from atributos a where tipo = $1 and valor = $2`,
    [tipo, valor],
  );
  if (!antes[0]) volver("atributos", "no-existe");
  if (antes[0].usos > 0) volver("atributos", "en-uso");
  if (antes[0].activo) {
    const otras = await query(`select 1 from atributos where tipo = $1 and activo and valor <> $2`, [tipo, valor]);
    if (!otras.length) volver("atributos", "ultima");
  }
  await query(`delete from atributos where tipo = $1 and valor = $2`, [tipo, valor]);
  await anotarCambio(admin.id, tipo, valor, { valor }, null);
  refrescarTodo();
  volver("atributos");
}

// ---- Palabras prohibidas ---------------------------------------------------------

export async function agregarPalabra(form: FormData): Promise<void> {
  const admin = await equipo();
  const frase = texto(form, "frase", 60, "palabras").toLowerCase();
  const motivo = texto(form, "motivo", 200, "palabras");
  if (frase.length < 3) volver("palabras", "frase");
  if (motivo.length < 10) volver("palabras", "motivo");
  const rows = await query<{ id: string }>(
    `insert into palabras_prohibidas (frase, motivo) values ($1, $2)
     on conflict (frase) do nothing returning id`,
    [frase, motivo],
  );
  if (!rows[0]) volver("palabras", "repetido");
  await anotarCambio(admin.id, "palabra", frase, null, { frase, motivo, activo: true });
  volver("palabras");
}

export async function alternarPalabra(form: FormData): Promise<void> {
  const admin = await equipo();
  const id = texto(form, "id", 40);
  const activo = form.get("activo") === "1";
  const antes = await query<{ frase: string; activo: boolean }>(
    `select frase, activo from palabras_prohibidas where id::text = $1`,
    [id],
  );
  if (!antes[0]) volver("palabras", "no-existe");
  await query(`update palabras_prohibidas set activo = $2 where id::text = $1`, [id, activo]);
  await anotarCambio(admin.id, "palabra", antes[0].frase, { activo: antes[0].activo }, { activo });
  volver("palabras");
}

// Una palabra prohibida no la usa nada guardado: se puede borrar siempre.
export async function borrarPalabra(form: FormData): Promise<void> {
  const admin = await equipo();
  const id = texto(form, "id", 40);
  const antes = await query<{ frase: string; motivo: string }>(
    `select frase, motivo from palabras_prohibidas where id::text = $1`,
    [id],
  );
  if (!antes[0]) volver("palabras", "no-existe");
  await query(`delete from palabras_prohibidas where id::text = $1`, [id]);
  await anotarCambio(admin.id, "palabra", antes[0].frase, { frase: antes[0].frase, motivo: antes[0].motivo }, null);
  volver("palabras");
}
