import { test } from "node:test";
import assert from "node:assert/strict";
import { stripNul } from "./db";

const NUL = String.fromCharCode(0);

test("quita el byte nulo de cadenas y de arreglos, y deja lo demás igual", () => {
  assert.equal(stripNul(`algo${NUL}malicioso`), "algomalicioso");
  assert.deepEqual(stripNul([`a${NUL}`, 5, null, "b"]), ["a", 5, null, "b"]);
  assert.equal(stripNul(42), 42);
  assert.equal(stripNul(null), null);
});
