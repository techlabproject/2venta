import { test } from "node:test";
import assert from "node:assert/strict";
import { redact } from "./redact";

const oculta = (t: string) => redact(t).text.includes("•••••");

test("oculta un número escrito de corrido", () => {
  assert.ok(oculta("mi celular es 3004128805"));
});

test("oculta un número con espacios, guiones y paréntesis", () => {
  assert.ok(oculta("300 412 88 05"));
  assert.ok(oculta("300-412-88-05"));
  assert.ok(oculta("(300) 4128805"));
  assert.ok(oculta("+57 300 412 8805"));
});

test("oculta un número escrito con letras en vez de dígitos", () => {
  // El truco más común: la O mayúscula por el cero, la ele por el uno.
  assert.ok(oculta("3OO 4l2 88 O5"));
});

test("oculta un número deletreado en palabras", () => {
  assert.ok(oculta("tres cero cero cuatro uno dos ocho ocho cero cinco"));
});

test("oculta correos, incluso disfrazados", () => {
  assert.ok(oculta("escríbeme a juan@correo.com"));
  assert.ok(oculta("juan arroba correo punto com"));
});

test("oculta enlaces y dominios sueltos", () => {
  assert.ok(oculta("mira https://otrositio.com/producto"));
  assert.ok(oculta("búscalo en www.otrositio.com"));
  assert.ok(oculta("está en mitienda.co"));
});

test("oculta menciones de billeteras y de otras plataformas", () => {
  for (const t of [
    "te paso mi Nequi",
    "consígname por daviplata",
    "hablemos por WhatsApp",
    "escríbeme al wasap",
    "mi instagram es el mismo",
  ]) {
    assert.ok(oculta(t), `no ocultó: ${t}`);
  }
});

test("dice qué tipo de dato ocultó", () => {
  assert.deepEqual(redact("mi nequi es 3004128805").redactions.sort(), [
    "billetera",
    "telefono",
  ]);
  assert.deepEqual(redact("hola, ¿sigue disponible?").redactions, []);
});

test("no toca un mensaje normal de compraventa", () => {
  // El costo de un filtro agresivo es tachar conversaciones legítimas, así que
  // esto importa tanto como lo que sí bloquea. Negociar el precio es justamente
  // para lo que existe el chat: si tacha "1.700.000", el filtro rompe el producto.
  for (const t of [
    "hola, ¿sigue disponible?",
    "¿me lo dejas en 1.700.000?",
    "¿tiene garantía de fábrica?",
    "lo compré en enero del 2024",
    "nos vemos en Chapinero por la 72",
    "batería al 89%, sin golpes",
    "¿aceptas 250 mil?",
    "12.500.000 por la moto",
    "el IMEI termina en 4821",
  ]) {
    assert.equal(redact(t).text, t, `tachó de más: ${t}`);
  }
});

test("conserva el resto del mensaje alrededor de lo que oculta", () => {
  const r = redact("hola, mi celular es 3004128805, escríbeme");
  assert.ok(r.text.startsWith("hola, mi celular es "));
  assert.ok(r.text.endsWith(", escríbeme"));
});

test("oculta varios datos en el mismo mensaje", () => {
  const r = redact("3004128805 o juan@correo.com o www.otro.com");
  assert.equal(r.text.match(/•••••/g)?.length, 3);
});
