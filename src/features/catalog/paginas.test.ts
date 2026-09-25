import { test } from "node:test";
import assert from "node:assert/strict";
import { hrefDePagina, leerPagina, MAX_PAGINAS, sinCamposVacios } from "./paginas";

test("la página sale de la dirección, y la basura es la primera", () => {
  assert.equal(leerPagina("3"), 3);
  assert.equal(leerPagina(undefined), 1);
  assert.equal(leerPagina("0"), 1);
  assert.equal(leerPagina("-2"), 1);
  assert.equal(leerPagina("2abc"), 1);
  assert.equal(leerPagina("1.5"), 1);
  assert.equal(leerPagina(["4", "9"]), 4);
  assert.equal(leerPagina("999"), MAX_PAGINAS);
  assert.equal(leerPagina("99999999"), 1);
});

test("el enlace a la página siguiente conserva los filtros", () => {
  const p = new URLSearchParams("q=silla&categoria=ropa&pagina=2");
  assert.equal(hrefDePagina("/buscar", p, 3), "/buscar?q=silla&categoria=ropa&pagina=3");
  assert.equal(hrefDePagina("/", new URLSearchParams(), 2), "/?pagina=2");
  assert.equal(hrefDePagina("/", new URLSearchParams("pagina=2"), 1), "/");
});

test("la dirección pierde los campos vacíos y el orden por defecto", () => {
  const p = new URLSearchParams("min=&max=&radio=5&zona=&orden=recientes&categoria=ropa&categoria=ninos");
  assert.equal(sinCamposVacios(p).toString(), "radio=5&categoria=ropa&categoria=ninos");
  assert.equal(sinCamposVacios(new URLSearchParams("orden=precio_asc")).toString(), "orden=precio_asc");
});
