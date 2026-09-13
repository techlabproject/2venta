import { test } from "node:test";
import assert from "node:assert/strict";
import { outputKeyFor } from "./provider";
import { isValidKey, isUploadKey } from "@/lib/storage";

test("la salida va a transcodificado/ con la misma ruta y extensión mp4", () => {
  assert.equal(
    outputKeyFor("2026-09/0b7d1f8e-9a2c-4c1a-8f0e-2a4b6c8d0e1f.webm"),
    "transcodificado/2026-09/0b7d1f8e-9a2c-4c1a-8f0e-2a4b6c8d0e1f.mp4"
  );
});

test("una salida es una clave válida para servir, pero no una que un cliente pueda reclamar", () => {
  const salida = outputKeyFor("2026-09/0b7d1f8e-9a2c-4c1a-8f0e-2a4b6c8d0e1f.webm");
  assert.equal(isValidKey(salida), true);
  assert.equal(isUploadKey(salida), false);
});
