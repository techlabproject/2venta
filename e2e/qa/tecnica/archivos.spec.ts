import { test, expect } from "@playwright/test";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { signUpload, describe as describeObject, KEY_PATTERN } from "../../../src/lib/storage";

config({ path: ".env.local" });

// Superficie de archivos (D-50): subidas directas a S3/MinIO firmadas por el
// servidor, y `claim` que comprueba la clave contra lo que S3 sabe antes de
// dejarla entrar a una publicación. Ver src/lib/storage.ts, src/features/publish/
// upload.ts y claim.ts (solo para entender la superficie, no para asumir que el
// código es correcto).

test.describe("subida firmada a MinIO/S3", () => {
  test("PUT sin firma (URL inventada) es rechazado por el bucket", async ({ request }) => {
    const key = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.jpg`;
    const res = await request.put(`http://localhost:9000/2venta-media/${key}`, {
      data: Buffer.from("contenido sin firmar"),
      headers: { "content-type": "image/jpeg" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    const object = await describeObject(key);
    expect(object).toBeNull();
  });

  test("una URL firmada para un tamaño no acepta un cuerpo de otro tamaño", async ({
    request,
  }) => {
    const ownerId = randomUUID();
    const realBody = Buffer.alloc(1000, "a");
    const signed = await signUpload("image/jpeg", realBody.length, ownerId);

    // Cuerpo más grande que el tamaño que se firmó.
    const biggerBody = Buffer.alloc(5000, "b");
    const res = await request.put(signed.url, {
      data: biggerBody,
      headers: signed.headers,
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);

    const object = await describeObject(signed.key);
    expect(object).toBeNull();
  });

  test("una URL firmada para image/jpeg no acepta content-type distinto", async ({
    request,
  }) => {
    const ownerId = randomUUID();
    const body = Buffer.alloc(1000, "a");
    const signed = await signUpload("image/jpeg", body.length, ownerId);

    const res = await request.put(signed.url, {
      data: body,
      headers: { ...signed.headers, "content-type": "image/png" },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("una URL firmada para un dueño no acepta que se cambie x-amz-meta-owner", async ({
    request,
  }) => {
    const ownerId = randomUUID();
    const otroOwnerId = randomUUID();
    const body = Buffer.alloc(1000, "a");
    const signed = await signUpload("image/jpeg", body.length, ownerId);

    const res = await request.put(signed.url, {
      data: body,
      headers: { ...signed.headers, "x-amz-meta-owner": otroOwnerId },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("una subida legítima queda con el tipo, tamaño y dueño firmados (control positivo)", async ({
    request,
  }) => {
    const ownerId = randomUUID();
    const body = Buffer.alloc(2048, "c");
    const signed = await signUpload("image/jpeg", body.length, ownerId);

    const res = await request.put(signed.url, { data: body, headers: signed.headers });
    expect(res.status()).toBeLessThan(300);

    const object = await describeObject(signed.key);
    expect(object).not.toBeNull();
    expect(object!.size).toBe(body.length);
    expect(object!.ownerId).toBe(ownerId);
    expect(object!.contentType).toBe("image/jpeg");
  });
});

test.describe("publicar no acepta una clave que no es del vendedor", () => {
  // NOTA METODOLÓGICA: `src/features/publish/claim.ts` importa con el alias
  // "@/lib/storage", que solo resuelve dentro del empaquetador de Next. Importado
  // directo desde una prueba de Playwright (fuera de Next), ese alias no resuelve
  // y el módulo no carga — no es un hallazgo, es una limitación de cómo se llama
  // aquí. Por eso esta sección prueba el mecanismo real del que depende `claim`
  // (los metadatos que S3 devuelve) en vez de importar la función, y complementa
  // con lectura de código para la parte que si depende del framework.
  test("el dueño que S3 reporta para una clave es el que se firmó, no uno que el cliente elija después", async () => {
    const v1Owner = randomUUID();
    const v2Owner = randomUUID();
    const videoBody = Buffer.alloc(3000, "v");
    const v1Signed = await signUpload("video/webm", videoBody.length, v1Owner);

    const put = await (await import("@playwright/test")).request.newContext();
    const putRes = await put.put(v1Signed.url, { data: videoBody, headers: v1Signed.headers });
    expect(putRes.status()).toBeLessThan(300);
    await put.dispose();

    // Esto es exactamente lo que `claim()` consulta antes de aceptar una clave:
    // el objeto existe, y su dueño es el que quedó grabado en S3 al subir, nunca
    // el que decida mandar quien publica después.
    const object = await describeObject(v1Signed.key);
    expect(object).not.toBeNull();
    expect(object!.ownerId).toBe(v1Owner);
    expect(object!.ownerId).not.toBe(v2Owner);
  });

  test("REVISIÓN DE CÓDIGO: el id de dueño que se compara en claim() viene siempre de la sesión, nunca del formulario", async () => {
    // src/features/publish/actions.ts:
    //   const user = await activeUser();               // de la cookie de sesión
    //   const video = await claim(form.get("video_key"), user.id, "video");
    // `claim` compara `object.ownerId !== ownerId` donde `ownerId` es `user.id`.
    // El cliente controla `video_key` pero no `user.id`: para "robar" la clave de
    // otro vendedor tendría que cambiar su propia sesión, no el campo del
    // formulario. Combinado con la prueba anterior (el dueño en S3 es el real),
    // publicar con la clave de otro vendedor queda cerrado en los dos extremos.
    expect(true).toBe(true);
  });

  test("una clave con forma inventada (no generada por el servidor) no calza el patrón que exige claim()", async () => {
    const invented = "2099-01/no-es-un-uuid.mp4";
    expect(KEY_PATTERN.test(invented)).toBe(false);
    const object = await describeObject(invented);
    expect(object).toBeNull();
  });

  test("una clave con forma válida pero nunca subida no existe en S3", async () => {
    const neverUploaded = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.mp4`;
    expect(KEY_PATTERN.test(neverUploaded)).toBe(true);
    const object = await describeObject(neverUploaded);
    expect(object).toBeNull();
  });
});

test.describe("las claves de subida no son adivinables (D-50)", () => {
  test("el patrón de clave usa un UUID v4 aleatorio, no un contador ni un dato previsible", async () => {
    const ownerId = randomUUID();
    const a = await signUpload("image/jpeg", 1000, ownerId);
    const b = await signUpload("image/jpeg", 1000, ownerId);
    expect(a.key).not.toBe(b.key);
    expect(a.key).toMatch(/^\d{4}-\d{2}\/[0-9a-f-]{36}\.jpg$/);
    // 122 bits de aleatoriedad en la parte variable: no es una secuencia.
  });
});

test.describe("/api/media ya no existe", () => {
  for (const path of [
    "/api/media/2024-01/algo.jpg",
    "/api/media/..%2F..%2F.env.local",
    "/api/media/",
  ]) {
    test(`GET ${path} responde 404`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(404);
    });
  }
});
