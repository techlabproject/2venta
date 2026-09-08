import { test } from "node:test";
import assert from "node:assert/strict";
import { checkConfig, describeProblems, REQUIREMENTS } from "./config";

const LARGO = "x".repeat(40);

/** Un entorno completo y válido, del que las pruebas van quitando cosas. */
function completo(isProduction = false): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = {};
  for (const r of REQUIREMENTS) {
    if (r.productionOnly && !isProduction) continue;
    env[r.name] =
      r.name === "DATABASE_URL"
        ? "postgres://u:p@localhost:5433/db"
        : r.name === "BETTER_AUTH_URL"
          ? "https://2venta.co"
          : LARGO;
  }
  return env;
}

test("un entorno completo no tiene problemas", () => {
  assert.deepEqual(checkConfig(completo(), false), []);
  assert.deepEqual(checkConfig(completo(true), true), []);
});

test("reporta TODAS las que faltan, no solo la primera", () => {
  // Detenerse en la primera obliga a un ciclo de prueba y error: se agrega una, se
  // reinicia, falla la siguiente.
  const env = completo();
  delete env.PHONE_CODE_SECRET;
  delete env.CRON_SECRET;
  delete env.KYC_WEBHOOK_SECRET;

  const problems = checkConfig(env, false);
  assert.equal(problems.length, 3);
  assert.deepEqual(
    problems.map((p) => p.name).sort(),
    ["CRON_SECRET", "KYC_WEBHOOK_SECRET", "PHONE_CODE_SECRET"]
  );
});

test("cada problema dice para qué sirve la variable", () => {
  // Quien la tiene que poner necesita saber qué es, no solo su nombre.
  const env = completo();
  delete env.PICKUP_CODE_SECRET;
  const [problem] = checkConfig(env, false);
  assert.match(problem.purpose, /entrega presencial/);
});

test("una variable vacía o con espacios cuenta como que falta", () => {
  const env = completo();
  env.CRON_SECRET = "   ";
  assert.equal(checkConfig(env, false).length, 1);
});

test("rechaza un secreto demasiado corto", () => {
  // Que exista no basta: un secreto de cuatro caracteres no protege nada.
  const env = completo();
  env.PHONE_CODE_SECRET = "corto";
  const [problem] = checkConfig(env, false);
  assert.equal(problem.name, "PHONE_CODE_SECRET");
  assert.match(problem.problem, /al menos 32/);
});

test("rechaza una URL de base de datos que no lo es", () => {
  const env = completo();
  env.DATABASE_URL = "mysql://algo";
  assert.match(checkConfig(env, false)[0].problem, /Postgres/);
});

test("en desarrollo no se exige lo que solo hace falta en producción", () => {
  // Exigir el proveedor de SMS o el dominio en desarrollo haría imposible trabajar.
  const env = completo(false);
  assert.deepEqual(checkConfig(env, false), []);

  // El mismo entorno, en producción, sí falla.
  const problems = checkConfig(env, true);
  assert.ok(problems.some((p) => p.name === "SMS_PROVIDER_TOKEN"));
  assert.ok(problems.some((p) => p.name === "BETTER_AUTH_URL"));
});

test("en producción la dirección pública tiene que ser https", () => {
  const env = completo(true);
  env.BETTER_AUTH_URL = "http://2venta.co";
  assert.match(checkConfig(env, true)[0].problem, /https/);
});

test("el mensaje nombra cada variable y su propósito", () => {
  const env = completo();
  delete env.CRON_SECRET;
  const texto = describeProblems(checkConfig(env, false));
  assert.match(texto, /CRON_SECRET/);
  assert.match(texto, /liberación automática/);
});
