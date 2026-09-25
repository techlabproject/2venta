// Carga la demostración: cuatro cuentas conocidas y doce artículos con fotos y
// video de verdad, para ver el producto como lo vería una persona.
//
// Corre igual en el portátil (`npm run demo`) y en la nube (tarea de ECS con
// `node demo.cjs`). Es idempotente: si una cuenta o un artículo ya existen, los
// deja en paz. Se niega a correr en producción.
//
// Las cuentas se crean por la misma API que usa la pantalla de registro, para
// que la contraseña quede como la guardaría la app; lo que la API no hace
// (confirmar el celular, aprobar la identidad, dar rol) se escribe directo en la
// base, que es lo que harían el proveedor de SMS, el de identidad y un
// administrador.

import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { signUpload } from "../src/lib/storage";
import { VERSION_TERMINOS } from "../src/features/legal/version";
import { appEnv } from "../src/lib/env";
import { ARTICULOS } from "./demo/articulos";
import { aCuadricula, zonaReconocida } from "../src/features/ubicacion/zonas";

if (appEnv() === "produccion") {
  console.error("La demostración no se carga en producción.");
  process.exit(1);
}

const APP_URL = (process.env.BETTER_AUTH_URL ?? "http://localhost:3100").replace(/\/$/, "");
const MEDIA = path.resolve("db/demo/media");
const PASSWORD = "Demo2venta.2026";

// Celulares fuera del rango real a propósito: 300 111 00 0x no es de nadie.
const CUENTAS = [
  { clave: "camila", email: "camila@2venta.demo", name: "Camila Vargas", phone: "+573001110001", alias: "Camila V.", zone: "Chapinero", kyc: true, role: null },
  { clave: "andres", email: "andres@2venta.demo", name: "Andrés Molina", phone: "+573001110002", alias: "Andrés M.", zone: "Usaquén", kyc: true, role: null },
  { clave: "laura", email: "laura@2venta.demo", name: "Laura Torres", phone: "+573001110003", alias: "Laura T.", zone: "Teusaquillo", kyc: false, role: null },
  { clave: "admin", email: "admin@2venta.demo", name: "Administración 2venta", phone: "+573001110004", alias: "2venta", zone: null, kyc: false, role: "admin" },
] as const;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureAccount(c: (typeof CUENTAS)[number]): Promise<string> {
  const existing = await pool.query<{ id: string }>(`select id from "user" where email = $1`, [c.email]);
  if (existing.rows[0]) return existing.rows[0].id;

  const res = await fetch(`${APP_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: APP_URL },
    body: JSON.stringify({ name: c.name, email: c.email, password: PASSWORD, phoneNumber: c.phone, alias: c.alias, termsVersion: VERSION_TERMINOS, birthDate: "1990-01-01" }),
  });
  if (!res.ok) throw new Error(`No se pudo crear ${c.email}: ${res.status} ${await res.text()}`);
  const created = await pool.query<{ id: string }>(`select id from "user" where email = $1`, [c.email]);
  const id = created.rows[0].id;

  await pool.query(
    `update "user" set "phoneNumberVerified" = true, role = coalesce($2, role) where id = $1`,
    [id, c.role]
  );
  // D-122: la zona ya no se escribe al registrarse; va con su punto aproximado.
  const zona = zonaReconocida(c.zone);
  if (zona) {
    await pool.query(
      `update "user" set zone = $2, ubicacion_lat = $3, ubicacion_lng = $4 where id = $1`,
      [id, zona.nombre, aCuadricula(zona.lat), aCuadricula(zona.lng)]
    );
  }
  if (c.kyc) {
    await pool.query(
      `insert into kyc_verifications (user_id, provider, reference, status)
       values ($1, 'prueba', $2, 'aprobado') on conflict (user_id) do nothing`,
      [id, `demo-${c.clave}`]
    );
  }
  console.log(`cuenta ${c.email}`);
  return id;
}

async function upload(file: string, contentType: string, ownerId: string): Promise<string> {
  const bytes = readFileSync(path.join(MEDIA, file));
  const signed = await signUpload(contentType, bytes.length, ownerId);
  const res = await fetch(signed.url, { method: "PUT", headers: signed.headers, body: bytes });
  if (!res.ok) throw new Error(`No se pudo subir ${file}: ${res.status}`);
  return signed.key;
}

async function main() {
  // Las pruebas automáticas y los agentes de QA crean cuentas @correo.com cuyos
  // artículos tapan la demo. Con --limpiar-pruebas se retiran (no se borran: los
  // pedidos son registros de dinero y no se tocan). Solo en desarrollo.
  if (process.argv.includes("--limpiar-pruebas")) {
    const { rowCount } = await pool.query(
      `update listings set status = 'retirada'
        where status in ('activa', 'reservada', 'en_revision')
          and seller_id in (select id from "user" where email like '%@correo.com')`
    );
    await pool.query(
      `update promotions set ends_at = now()
        where ends_at > now()
          and seller_id in (select id from "user" where email like '%@correo.com')`
    );
    console.log(`limpieza: ${rowCount} publicaciones de prueba retiradas`);
  }

  // Los tres productos del seed apuntan a archivos que no existen (seed/...) y
  // salen sin foto. En la demo se retiran: lo que se muestra tiene medios reales.
  await pool.query(`update listings set status = 'retirada' where video_path like 'seed/%' and status = 'activa'`);

  const ids: Record<string, string> = {};
  for (const c of CUENTAS) ids[c.clave] = await ensureAccount(c);

  for (const a of ARTICULOS) {
    const sellerId = ids[a.vendedor];
    const exists = await pool.query(`select 1 from listings where seller_id = $1 and title = $2`, [sellerId, a.title]);
    if (exists.rows.length) {
      // Los que ya estaban también reciben su talla o edad (corrección 38).
      await pool.query(
        `update listings set talla = coalesce(talla, $3), edad = coalesce(edad, $4)
          where seller_id = $1 and title = $2`,
        [sellerId, a.title, a.talla ?? null, a.edad ?? null],
      );
      continue;
    }

    const video = await upload(`${a.slug}.mp4`, "video/mp4", sellerId);
    const poster = await upload(`${a.slug}-portada.jpg`, "image/jpeg", sellerId);
    const { rows } = await pool.query<{ id: string }>(
      `insert into listings (seller_id, title, description, category, condition, price_cop,
                             video_path, poster_path, imei, status, talla, edad)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'activa', $10, $11) returning id`,
      [sellerId, a.title, a.description, a.category, a.condition, a.price_cop, video, poster, a.imei ?? null,
       a.talla ?? null, a.edad ?? null]
    );
    for (let i = 1; i <= 3; i++) {
      const key = await upload(`${a.slug}-${i}.jpg`, "image/jpeg", sellerId);
      await pool.query(`insert into listing_photos (listing_id, path, position) values ($1, $2, $3)`, [rows[0].id, key, i - 1]);
    }
    console.log(`artículo ${a.title}`);
  }

  console.log(`\nListo. Cuentas de prueba (contraseña ${PASSWORD}):`);
  for (const c of CUENTAS) console.log(`  ${c.email}  ${c.kyc ? "vendedor verificado" : c.role ?? "comprador"}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
