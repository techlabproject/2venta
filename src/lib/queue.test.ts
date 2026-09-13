import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJob } from "./queue";

test("reconoce los trabajos que existen", () => {
  assert.deepEqual(parseJob('{"type":"liberar"}'), { type: "liberar" });
  assert.deepEqual(parseJob('{"type":"avisar","listingId":"abc"}'), {
    type: "avisar",
    listingId: "abc",
  });
  assert.deepEqual(parseJob('{"type":"transcodificar","key":"2026-09/x.webm"}'), {
    type: "transcodificar",
    key: "2026-09/x.webm",
  });
  assert.deepEqual(parseJob('{"type":"video_listo","original":"a","salida":"b"}'), {
    type: "video_listo",
    original: "a",
    salida: "b",
  });
});

test("rechaza lo que no tiene la forma esperada", () => {
  for (const body of ["", "no es json", "null", "42", '{"type":"borrar"}', '{"type":"avisar"}', '{"type":"avisar","listingId":7}', '{"type":"transcodificar"}', '{"type":"video_listo","original":"a"}']) {
    assert.equal(parseJob(body), null, `aceptó ${body}`);
  }
});
