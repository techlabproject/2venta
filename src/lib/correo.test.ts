import { test } from "node:test";
import assert from "node:assert/strict";
import { problemaDeCorreo, sugerenciaDeCorreo } from "./correo";

test("el caso de Catalina: sin dominio se explica", () => {
  assert.match(problemaDeCorreo("cata@mail")!, /cata@mail\.com/);
});

test("correos bien escritos pasan", () => {
  for (const c of ["cata@gmail.com", "ana.maria+tienda@empresa.com.co", " Laura@Hotmail.es "]) {
    assert.equal(problemaDeCorreo(c), null, c);
  }
});

test("cada forma rota dice qué le falta", () => {
  assert.match(problemaDeCorreo("catagmail.com")!, /falta la @/);
  assert.match(problemaDeCorreo("cata@@gmail.com")!, /más de una @/);
  assert.match(problemaDeCorreo("@gmail.com")!, /antes de la @/);
  assert.match(problemaDeCorreo("cata@")!, /después de la @/);
  assert.match(problemaDeCorreo("cata @gmail.com")!, /espacios/);
  assert.match(problemaDeCorreo("cata@gmail..com")!, /puntos/);
  assert.match(problemaDeCorreo("cata@gmail.c")!, /Revisa el correo/);
  assert.match(problemaDeCorreo("")!, /Escribe tu correo/);
});

test("sugiere el dominio común más parecido", () => {
  assert.equal(sugerenciaDeCorreo("cata@gmial.com"), "cata@gmail.com");
  assert.equal(sugerenciaDeCorreo("cata@gmail.con"), "cata@gmail.com");
  assert.equal(sugerenciaDeCorreo("cata@hotmal.com"), "cata@hotmail.com");
  assert.equal(sugerenciaDeCorreo("cata@outlok.es"), "cata@outlook.es");
});

test("no sugiere nada sobre dominios correctos o lejanos", () => {
  assert.equal(sugerenciaDeCorreo("cata@gmail.com"), null);
  assert.equal(sugerenciaDeCorreo("cata@universidad.edu.co"), null);
  assert.equal(sugerenciaDeCorreo("cata"), null);
});

// Luna, fila 6.
test("formas imposibles también se marcan", () => {
  for (const c of ["luna.@gmail.com", ".luna@gmail.com", "cata@-gmail.com", "cata@gmail-.com", "cata@gm_ail.com"]) {
    assert.notEqual(problemaDeCorreo(c), null, c);
  }
  assert.match(problemaDeCorreo(`${"a".repeat(245)}@gmail.com`)!, /largo/);
  assert.match(problemaDeCorreo(`${"a".repeat(65)}@gmail.com`)!, /largo/);
});

test("no sugiere cambiar un .co legítimo, salvo gmail.co", () => {
  assert.equal(sugerenciaDeCorreo("cata@hotmail.co"), null);
  assert.equal(sugerenciaDeCorreo("cata@outlook.co"), null);
  assert.equal(sugerenciaDeCorreo("cata@gmail.co"), "cata@gmail.com");
});
