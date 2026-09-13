import { test, before } from "node:test";
import assert from "node:assert/strict";
import { claim } from "./claim";
import { signUpload } from "@/lib/storage";

// Corre contra el bucket local (MinIO, `docker compose up -d`). Es la única forma
// de probar lo que importa aquí: que la comprobación mira lo que S3 registró y no
// lo que dice el cliente.

async function upload(type: string, bytes: Uint8Array<ArrayBuffer>, owner: string): Promise<string> {
  const signed = await signUpload(type, bytes.length, owner);
  const res = await fetch(signed.url, { method: "PUT", headers: signed.headers, body: bytes });
  assert.equal(res.status, 200, `la subida de prueba falló: ${res.status}`);
  return signed.key;
}

let videoDeAna: string;
let fotoDeAna: string;

before(async () => {
  videoDeAna = await upload("video/webm", new Uint8Array(16), "ana");
  fotoDeAna = await upload("image/png", new Uint8Array(8), "ana");
});

test("la dueña puede reclamar su video", async () => {
  const r = await claim(videoDeAna, "ana", "video");
  assert.ok("key" in r);
  assert.equal(r.object.contentType, "video/webm");
  assert.equal(r.object.size, 16);
});

test("otro vendedor no puede publicar con el video de Ana", async () => {
  const r = await claim(videoDeAna, "bruno", "video");
  assert.ok("error" in r);
  assert.match(r.error, /no es tuyo/);
});

test("una clave que nunca se subió se rechaza", async () => {
  const r = await claim("2026-09/00000000-0000-4000-8000-000000000000.webm", "ana", "video");
  assert.ok("error" in r);
  assert.match(r.error, /no existe/);
});

test("una clave con forma inválida se rechaza sin consultar el bucket", async () => {
  for (const raw of ["../.env.local", "/etc/passwd", "2026-09/x.webm", "", null, "seed/demo.webm"]) {
    const r = await claim(raw, "ana", "video");
    assert.ok("error" in r, `aceptó ${JSON.stringify(raw)}`);
  }
});

test("una foto no pasa por video, ni un video por foto", async () => {
  const a = await claim(fotoDeAna, "ana", "video");
  assert.ok("error" in a && /tipo/.test(a.error));
  const b = await claim(videoDeAna, "ana", "image");
  assert.ok("error" in b && /tipo/.test(b.error));
});

test("firmar un tipo no permitido o un tamaño fuera de límite falla antes de tocar el bucket", async () => {
  await assert.rejects(() => signUpload("application/pdf", 10, "ana"), /no permitido/);
  await assert.rejects(() => signUpload("video/mp4", 0, "ana"), /Tamaño/);
  await assert.rejects(() => signUpload("video/mp4", 61 * 1024 * 1024, "ana"), /Tamaño/);
});
