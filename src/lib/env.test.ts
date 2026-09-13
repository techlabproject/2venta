import { test } from "node:test";
import assert from "node:assert/strict";
import { appEnv, isProduction } from "./env";

test("sin APP_ENV, una compilación de producción se comporta como producción", () => {
  assert.equal(appEnv({ NODE_ENV: "production" }), "produccion");
  assert.equal(isProduction({ NODE_ENV: "production" }), true);
});

test("sin APP_ENV, el servidor de desarrollo es desarrollo", () => {
  assert.equal(appEnv({ NODE_ENV: "development" }), "desarrollo");
  assert.equal(appEnv({}), "desarrollo");
});

test("APP_ENV manda sobre NODE_ENV en las dos direcciones", () => {
  assert.equal(appEnv({ NODE_ENV: "production", APP_ENV: "desarrollo" }), "desarrollo");
  assert.equal(appEnv({ NODE_ENV: "development", APP_ENV: "produccion" }), "produccion");
});

test("un valor desconocido no arranca", () => {
  assert.throws(() => appEnv({ APP_ENV: "staging" }), /solo admite "desarrollo" o "produccion"/);
});

test("vacío cuenta como ausente", () => {
  assert.equal(appEnv({ APP_ENV: "", NODE_ENV: "production" }), "produccion");
});
