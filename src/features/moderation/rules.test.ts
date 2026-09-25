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

// Corrección 52 (D-128): el equipo agrega frases desde el panel, con su motivo. Se
// comparan sin tildes ni mayúsculas y por palabra completa: «iqos» no rechaza
// «iqoscopio», igual que «arma» no rechaza «armario».
test("las frases del equipo se aplican por palabra completa, sin tildes ni mayúsculas", () => {
  const frases = [{ frase: "vapeador desechable", motivo: "No se pueden publicar vapeadores." }];
  assert.deepEqual(
    moderateListing({ title: "Vapeador DESECHABLE nuevo", description: "Sin uso" }, frases),
    { allowed: false, reason: "No se pueden publicar vapeadores." },
  );
  assert.deepEqual(
    moderateListing({ title: "Vapeadór desechable", description: "" }, frases),
    { allowed: false, reason: "No se pueden publicar vapeadores." },
  );
  assert.deepEqual(
    moderateListing({ title: "Vapeadores desechables", description: "" }, frases),
    { allowed: true },
  );
  // Sin frases, lo de siempre.
  assert.deepEqual(moderateListing({ title: "Vapeador desechable", description: "" }), {
    allowed: true,
  });
});
