import { test } from "node:test";
import assert from "node:assert/strict";
import { initialStatus, moderateListing } from "./rules";

const permite = (title: string, description = "En buen estado.") =>
  moderateListing({ title, description }).allowed;

test("rechaza lo evidentemente prohibido", () => {
  assert.ok(!permite("Pistola calibre 9mm"));
  assert.ok(!permite("Vendo marihuana"));
  assert.ok(!permite("Réplica de Rolex"));
  assert.ok(!permite("Cédula falsa"));
  assert.ok(!permite("Vendo cachorros"));
  assert.ok(!permite("Antibiótico sin receta"));
  assert.ok(!permite("iPhone robado barato"));
});

test("explica por qué rechaza", () => {
  const verdict = moderateListing({ title: "Pistola 9mm", description: "" });
  assert.equal(verdict.allowed, false);
  if (!verdict.allowed) {
    assert.match(verdict.reason, /armas de fuego/i);
  }
});

test("también mira la descripción, no solo el título", () => {
  assert.ok(!permite("Celular barato", "Está robado pero funciona perfecto."));
});

test("no rechaza publicaciones legítimas que se parecen", () => {
  // Es la mitad del trabajo: un filtro que tacha de más pierde vendedores.
  // "arma" a secas rechazaría todo esto.
  for (const titulo of [
    "Armario de tres puertas",
    "Mueble armado en madera",
    "Cama con base y colchón",
    // En Colombia "perico" son huevos revueltos y también un loro. Por eso no
    // está en la lista: un filtro que tacha de más pierde vendedores.
    "Huevos pericos, sartén antiadherente",
    "Camiseta Nike original con etiqueta",
    "iPhone 13 con caja y factura",
    "Licencia de conducir vencida, marco decorativo",
    "Juguete de perro de peluche",
    "Botiquín vacío",
  ]) {
    assert.ok(permite(titulo), `rechazó de más: ${titulo}`);
  }
});

test("todo sale directo al catálogo, electrónica incluida", () => {
  // Corrección 40 (decisión de Nicolás): sin revisión humana previa.
  assert.equal(initialStatus(), "activa");
});
