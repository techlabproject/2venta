import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBulk, MAX_ROWS } from "./bulk";

const CATEGORIES = ["tecnologia", "ropa", "ninos"];
const HEADER = "titulo,categoria,precio,estado,descripcion,imei";

const parse = (body: string) => parseBulk(`${HEADER}\n${body}`, CATEGORIES);

test("lee un archivo bien formado", () => {
  const result = parse(
    [
      "Chaqueta de jean,ropa,95000,usado bueno,Poco uso,",
      "Coche Chicco,ninos,260000,usado regular,Ruedas perfectas,",
      "iPhone 13,tecnologia,1850000,usado bueno,Batería al 89%,490154203237518",
    ].join("\n")
  );
  assert.ok(result.ok);
  if (!result.ok) return;
  assert.equal(result.rows.length, 3);
  assert.equal(result.errors.length, 0);
  assert.equal(result.rows[0].priceCop, 95_000);
  assert.equal(result.rows[2].imei, "490154203237518");
});

test("respeta las comas dentro de comillas", () => {
  // La descripción casi siempre lleva comas; sin esto se partiría en dos celdas.
  const result = parse('Mesa,ninos,120000,nuevo,"Madera maciza, sin rayones",');
  assert.ok(result.ok);
  if (!result.ok) return;
  assert.equal(result.rows[0].description, "Madera maciza, sin rayones");
});

test("rechaza el archivo si faltan columnas y dice cuáles", () => {
  const result = parseBulk("titulo,precio\nAlgo,1000", CATEGORIES);
  assert.ok(!result.ok);
  if (result.ok) return;
  assert.match(result.error, /categoria/);
  assert.match(result.error, /estado/);
  assert.match(result.error, /descripcion/);
});

test("rechaza un archivo vacío", () => {
  assert.ok(!parseBulk(HEADER, CATEGORIES).ok);
  assert.ok(!parseBulk("", CATEGORIES).ok);
});

test("rechaza un archivo con demasiadas filas", () => {
  const body = Array.from(
    { length: MAX_ROWS + 1 },
    (_, i) => `Cosa ${i},ropa,50000,nuevo,Descripción,`
  ).join("\n");
  const result = parse(body);
  assert.ok(!result.ok);
  if (result.ok) return;
  assert.match(result.error, new RegExp(String(MAX_ROWS)));
});

test("una fila mala no tumba las buenas", () => {
  // Rechazar el archivo entero por una fila obliga a la tienda a repetir el
  // trabajo de las otras noventa y nueve.
  const result = parse(
    [
      "Buena,ropa,50000,nuevo,Descripción,",
      "Precio malo,ropa,-500,nuevo,Descripción,",
      "Otra buena,ropa,60000,nuevo,Descripción,",
    ].join("\n")
  );
  assert.ok(result.ok);
  if (!result.ok) return;
  assert.equal(result.rows.length, 2);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].line, 3);
  assert.match(result.errors[0].message, /Precio/);
});

test("señala la línea real del archivo, contando el encabezado", () => {
  const result = parse(["Buena,ropa,50000,nuevo,D,", "Mala,inventada,50000,nuevo,D,"].join("\n"));
  assert.ok(result.ok);
  if (!result.ok) return;
  assert.equal(result.errors[0].line, 3);
});

test("exige IMEI válido en electrónica y no en las demás", () => {
  const conMalo = parse("Celular,tecnologia,900000,usado bueno,Descripción,123");
  assert.ok(conMalo.ok);
  if (conMalo.ok) assert.match(conMalo.errors[0].message, /IMEI/);

  const sinImei = parse("Camisa,ropa,50000,nuevo,Descripción,");
  assert.ok(sinImei.ok);
  if (sinImei.ok) {
    assert.equal(sinImei.rows.length, 1);
    assert.equal(sinImei.rows[0].imei, null);
  }
});

test("aplica el mismo filtro de contenido que publicar de a uno", () => {
  // Cargar en lote no puede ser una puerta trasera para lo que está prohibido.
  const result = parse("Pistola 9mm,ropa,500000,nuevo,Funciona bien,");
  assert.ok(result.ok);
  if (result.ok) assert.match(result.errors[0].message, /armas de fuego/i);
});

test("acepta el estado escrito con espacio o con guion bajo", () => {
  for (const estado of ["usado bueno", "usado_bueno", "Usado Bueno"]) {
    const result = parse(`Cosa,ropa,50000,${estado},Descripción,`);
    assert.ok(result.ok);
    if (result.ok) assert.equal(result.rows.length, 1, `falló con ${estado}`);
  }
});
