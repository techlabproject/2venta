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

  // Filas 33 y 34 (D-129): con 12 artículos y 24 por página nunca se ve la página 2.
  // `--paginacion` suma 40 más, 20 por vendedor. Decisión 4 de Nicolás (D-130): con
  // títulos naturales, no «demostración N». Cada uno reutiliza el video y las fotos de
  // un artículo de la demo, así que el título describe lo mismo que se ve. Idempotente:
  // cada título es único.
  if (process.argv.includes("--paginacion")) {
    const VARIANTES: Record<string, Array<[string, string, number]>> = {
      "Atrapasueños": [
        ["Atrapasueños tejido a mano, blanco", "Decoración para cuarto de niños. Plumas completas, sin manchas.", 30_000],
        ["Móvil de cuna estilo atrapasueños", "Lo usamos poco. Se cuelga fácil del techo.", 28_000],
        ["Atrapasueños grande con plumas", "Mide unos 60 cm de largo. Bien cuidado.", 45_000],
      ],
      "Bicicleta infantil": [
        ["Bicicleta para niño rin 16, azul", "Con rueditas de apoyo. Frenos funcionando.", 230_000],
        ["Bicicleta infantil con canasta", "Para niños de 4 a 6 años. Llantas en buen estado.", 210_000],
        ["Bici de niño rin 16 con timbre", "Poco uso, la cadena está nueva.", 260_000],
        ["Bicicleta para aprender a montar", "Trae las rueditas. Se la entrego ajustada.", 190_000],
      ],
      "Bolso de cuero": [
        ["Bolso de cuero marrón para portátil", "Cabe un portátil de 13 pulgadas. Cierre bueno.", 170_000],
        ["Maletín de cuero hecho en Colombia", "Tiene marcas de uso en las esquinas, se ven en el video.", 150_000],
        ["Bolso cruzado de cuero café", "Correa ajustable. Muy buen estado.", 160_000],
        ["Cartera grande de cuero", "Amplia, con bolsillo interno.", 140_000],
      ],
      "Control DualShock": [
        ["Control de PS4 negro, original", "Funciona perfecto. Sin cable.", 130_000],
        ["Control inalámbrico para PlayStation 4", "Batería dura bien. Botones firmes.", 120_000],
        ["Control PS4 usado, buen estado", "Lo pruebo en el video con la consola.", 110_000],
        ["Mando DualShock 4", "Sticks sin drift. Original.", 135_000],
      ],
      "Gafas de sol": [
        ["Gafas de sol tipo aviador", "Lentes sin rayones. Incluyo estuche.", 75_000],
        ["Lentes de sol marco dorado", "Usados pocas veces.", 70_000],
        ["Gafas aviador unisex", "Marco firme, sin golpes.", 80_000],
      ],
      "Guante de béisbol": [
        ["Guante de béisbol para niño", "Cuero suave, ya está amoldado.", 65_000],
        ["Guante de softbol juvenil", "Mano derecha. Buen estado.", 60_000],
        ["Manilla de béisbol en cuero", "Para niños de 8 a 12 años.", 75_000],
      ],
      "MacBook Air": [
        ["MacBook Air 2020 plateado", "Batería al 89 %. Con cargador original.", 2_700_000],
        ["Portátil Apple 13 pulgadas, 256 GB", "Lo usé para estudiar. Sin golpes.", 2_650_000],
        ["MacBook Air M1, 8 GB de RAM", "Funciona perfecto. Teclado en español.", 2_900_000],
        ["Portátil MacBook para trabajo", "Pantalla sin rayones. Se entrega formateado.", 2_600_000],
      ],
      "Tacones blancos": [
        ["Tacones blancos talla 36", "Usados una sola vez en un matrimonio.", 90_000],
        ["Zapatos de tacón blancos", "Tacón de 9 cm. Con caja.", 85_000],
        ["Tacones de novia talla 37", "Como nuevos.", 110_000],
      ],
      "Tenis Converse": [
        ["Tenis Converse blancos talla 41", "Originales. Lavados.", 115_000],
        ["Converse clásicos de lona", "Un año de uso. Suela buena.", 100_000],
        ["Tenis de bota Converse talla 42", "En buen estado, se ve la etiqueta.", 125_000],
        ["Tenis Chuck Taylor usados", "Talla 42. Cordones nuevos.", 95_000],
      ],
      "Tornamesa": [
        ["Tornamesa para vinilos con cápsula nueva", "Suena limpia. Trae cable RCA.", 600_000],
        ["Tocadiscos Audio-Technica", "Automático. Muy buen estado.", 650_000],
        ["Tornamesa automática para LP", "Solo entrega en persona por el tamaño.", 580_000],
      ],
      "Triciclo": [
        ["Triciclo rojo de metal", "Para niños de 2 a 4 años. Llantas de caucho.", 100_000],
        ["Triciclo infantil con canasta", "Limpio y sin piezas sueltas.", 95_000],
        ["Triciclo para niño pequeño", "Mi hijo ya no lo usa.", 90_000],
        ["Triciclo clásico rojo", "Pedales firmes. Buen estado.", 105_000],
      ],
    };
    let creados = 0;
    let n = 0;
    for (const [prefijo, lista] of Object.entries(VARIANTES)) {
      const base = await pool.query<{
        id: string; category: string; condition: string; video_path: string; poster_path: string;
        talla: string | null; edad: string | null;
      }>(
        `select id, category, condition, video_path, poster_path, talla, edad
           from listings where seller_id = any($1) and title like $2 order by created_at limit 1`,
        [[ids.camila, ids.andres], `${prefijo}%`],
      );
      const b = base.rows[0];
      if (!b) continue;
      for (const [title, description, precio] of lista) {
        n++;
        const exists = await pool.query(`select 1 from listings where title = $1`, [title]);
        if (exists.rows.length) continue;
        const sellerId = n % 2 === 0 ? ids.camila : ids.andres;
        const { rows } = await pool.query<{ id: string }>(
          `insert into listings (seller_id, title, description, category, condition, price_cop,
                                 video_path, poster_path, status, talla, edad)
           values ($1, $2, $3, $4, $5, $6, $7, $8, 'activa', $9, $10) returning id`,
          [sellerId, title, description, b.category, b.condition, precio, b.video_path, b.poster_path, b.talla, b.edad],
        );
        await pool.query(
          `insert into listing_photos (listing_id, path, position)
           select $1, path, position from listing_photos where listing_id = $2`,
          [rows[0].id, b.id],
        );
        creados++;
      }
    }
    console.log(`paginación: ${creados} artículos nuevos (de ${n})`);
  }

  console.log(`\nListo. Cuentas de prueba (contraseña ${PASSWORD}):`);
  for (const c of CUENTAS) console.log(`  ${c.email}  ${c.kyc ? "vendedor verificado" : c.role ?? "comprador"}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
