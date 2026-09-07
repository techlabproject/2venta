import { test } from "node:test";
import assert from "node:assert/strict";
import {
  breakdown,
  commissionCop,
  parseCop,
  COMMISSION_MAX_COP,
  COMMISSION_MIN_COP,
  sellerPayoutCop,
} from "./money";

test("cobra el 5% en el tramo normal", () => {
  assert.equal(commissionCop(100_000), 5_000);
  assert.equal(commissionCop(1_000_000), 50_000);
  assert.equal(commissionCop(1_850_000), 92_500);
});

test("aplica el piso cuando el 5% se queda corto", () => {
  // Por debajo de $50.000, el 5% es menos que el piso.
  assert.equal(commissionCop(10_000), COMMISSION_MIN_COP);
  assert.equal(commissionCop(30_000), COMMISSION_MIN_COP);
  assert.equal(commissionCop(49_999), COMMISSION_MIN_COP);
  // Justo en $50.000 el 5% iguala el piso y a partir de ahí manda el porcentaje.
  assert.equal(commissionCop(50_000), 2_500);
  assert.equal(commissionCop(60_000), 3_000);
});

test("aplica el techo en los artículos caros", () => {
  // El techo empieza a morder en $2.400.000.
  assert.equal(commissionCop(2_400_000), COMMISSION_MAX_COP);
  assert.equal(commissionCop(2_400_001), COMMISSION_MAX_COP);
  assert.equal(commissionCop(3_500_000), COMMISSION_MAX_COP);
  assert.equal(commissionCop(9_000_000), COMMISSION_MAX_COP);
});

test("la tarifa efectiva baja en los artículos caros, que es para lo que existe el techo", () => {
  const efectiva = (p: number) => commissionCop(p) / p;
  assert.ok(efectiva(3_500_000) < 0.035, "un iPhone debería pagar menos del 3,5%");
  assert.ok(efectiva(9_000_000) < 0.015, "un artículo de nueve millones, menos del 1,5%");
});

test("redondea al entero más cercano y nunca devuelve decimales", () => {
  for (const precio of [123_457, 999_999, 1_000_001, 77_777]) {
    assert.ok(Number.isInteger(commissionCop(precio)), `${precio} produjo decimales`);
  }
  // 5% de 123.457 es 6.172,85
  assert.equal(commissionCop(123_457), 6_173);
});

test("el vendedor recibe el subtotal menos la comisión, y las cifras cuadran", () => {
  for (const precio of [10_000, 95_000, 260_000, 1_850_000, 5_000_000]) {
    const b = breakdown(precio);
    assert.equal(
      b.sellerPayoutCop + b.commissionCop,
      b.subtotalCop,
      `no cuadra en ${precio}`
    );
    assert.equal(b.sellerPayoutCop, sellerPayoutCop(precio));
    assert.ok(b.sellerPayoutCop > 0, `el vendedor no recibiría nada en ${precio}`);
  }
});

test("rechaza montos que no son enteros en pesos", () => {
  // Un decimal aquí significa que alguien usó punto flotante en algún lado.
  assert.throws(() => commissionCop(1000.5), /Monto inválido/);
  assert.throws(() => commissionCop(-1), /Monto inválido/);
  assert.throws(() => commissionCop(NaN), /Monto inválido/);
  assert.throws(() => commissionCop(Infinity), /Monto inválido/);
});

test("el envío se le cobra al comprador pero no paga comisión", () => {
  const b = breakdown(200_000, 15_000);
  assert.equal(b.buyerTotalCop, 215_000, "el comprador paga producto más envío");
  // La comisión sale del producto solamente: 5% de 200.000.
  assert.equal(b.commissionCop, 10_000);
  assert.equal(b.sellerPayoutCop, 190_000);
  // 2venta no gana sobre la plata de la transportadora.
  assert.equal(b.commissionCop, commissionCop(200_000));
});

test("sin envío el total del comprador es el subtotal", () => {
  const b = breakdown(200_000);
  assert.equal(b.buyerTotalCop, b.subtotalCop);
  assert.equal(b.shippingCop, 0);
});

test("rechaza un costo de envío que no sea entero", () => {
  assert.throws(() => breakdown(200_000, 15_000.5), /Monto inválido/);
  assert.throws(() => breakdown(200_000, -1), /Monto inválido/);
});

test("lee montos escritos como los escribe la gente", () => {
  assert.equal(parseCop("10000"), 10_000);
  assert.equal(parseCop("1.700.000"), 1_700_000);
  assert.equal(parseCop("1,700,000"), 1_700_000);
  assert.equal(parseCop(" 260000 "), 260_000);
});

test("rechaza un precio negativo en vez de volverlo positivo", () => {
  // Hallazgo de Luna: quitar lo que no fuera dígito se comía el signo, así que
  // "-10000" se publicaba como "10000". Corregir en silencio lo que alguien
  // escribió publica un precio que el vendedor nunca puso.
  assert.equal(parseCop("-10000"), null);
  assert.equal(parseCop("- 10000"), null);
  assert.equal(parseCop("−10000"), null); // signo menos tipográfico
});

test("rechaza lo que no es un monto", () => {
  for (const raw of ["", "  ", "0", "abc", "10 mil", "1e5", "10.5", "10,5", "$10000", "10000a"]) {
    assert.equal(parseCop(raw), null, `aceptó de más: ${JSON.stringify(raw)}`);
  }
});
