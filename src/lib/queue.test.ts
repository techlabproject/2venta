import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJob } from "./queue";

test("reconoce los dos trabajos que existen", () => {
  assert.deepEqual(parseJob('{"type":"liberar"}'), { type: "liberar" });
  assert.deepEqual(parseJob('{"type":"avisar","listingId":"abc"}'), {
    type: "avisar",
    listingId: "abc",
  });
});

test("rechaza lo que no tiene la forma esperada", () => {
  for (const body of ["", "no es json", "null", "42", '{"type":"borrar"}', '{"type":"avisar"}', '{"type":"avisar","listingId":7}']) {
    assert.equal(parseJob(body), null, `aceptó ${body}`);
  }
});
