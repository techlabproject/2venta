# Rebanada S-27 — Archivos en S3, subida directa desde el navegador

Los puntos 1 y 2 de la sección 9 de `ARQUITECTURA.md`, y la D-50.

## Qué hace

- Los archivos (video, portada, fotos) viven en un bucket de S3. En el portátil ese
  bucket lo da MinIO, un servicio más en `docker-compose.yml`, compatible con la
  misma API. No hay camino de "disco local": el código que se prueba es el que se
  despliega.
- El navegador sube directo al bucket con una URL prefirmada de corta duración que
  firma el servidor. La acción de publicar recibe **claves**, no archivos. Un video
  de hasta 60 MB nunca atraviesa el contenedor.
- Los archivos se sirven desde `MEDIA_BASE_URL` (CloudFront en AWS, MinIO en el
  portátil). La ruta `/api/media/[...path]` desaparece.

## Cómo se protege

La D-50 conserva la validación del lado del servidor, y aquí hay más superficie
que antes porque el cliente manda una clave que él eligió cómo obtener:

1. **Al firmar.** Solo firma un usuario con celular confirmado e identidad
   aprobada, para un tipo permitido y un tamaño dentro del límite. La firma cubre
   `Content-Type`, `Content-Length` y una cabecera `x-amz-meta-owner` con el id del
   usuario: si el navegador cambia cualquiera de las tres, S3 rechaza la subida.
   La URL vale cinco minutos.
2. **Al publicar.** La clave tiene que tener la forma exacta que genera el servidor
   (`AAAA-MM/uuid.ext`), y se consulta el objeto (`HeadObject`): tiene que existir,
   su `owner` tiene que ser quien publica, y su tipo y tamaño se comprueban otra
   vez contra lo que S3 registró, no contra lo que dijo el cliente. Sin esto,
   alguien podría publicar con la clave del video de otro vendedor, o con un
   objeto que nunca se subió.
3. **El nombre lo pone el servidor.** Igual que antes: identificador aleatorio y
   extensión derivada del tipo. Nunca el nombre que manda el cliente.

## Archivos que toca

- `src/lib/storage.ts` — reescrito: cliente de S3, `signUpload`, `describe`,
  `keyPattern`. Sigue siendo el único archivo que sabe dónde viven los archivos.
- `src/lib/media.ts` — nuevo, `mediaUrl(key)`. Lo usan las pantallas de servidor.
- `src/features/publish/upload.ts` — nuevo, acción de servidor `requestUpload`.
- `src/features/publish/claim.ts` — nuevo, la comprobación de una clave contra S3,
  con su prueba contra MinIO (`claim.test.ts`).
- `src/features/publish/useUpload.ts` — nuevo, cliente: pide la firma y hace el
  `PUT`. Compartido por los dos formularios.
- `src/features/publish/PublishForm.tsx`, `DraftVideoForm.tsx` — suben antes de
  enviar y mandan claves.
- `src/features/publish/actions.ts` — recibe claves; comprueba con `describe`.
- Las cuatro pantallas que hoy arman `/api/media/...`.
- `src/app/api/media/[...path]/route.ts` — se borra. `uploads/` también.
- `src/lib/config.ts` — `AWS_REGION`, `S3_BUCKET`, `MEDIA_BASE_URL`;
  `S3_ENDPOINT` y `S3_PUBLIC_ENDPOINT` opcionales (solo MinIO).
- `docker-compose.yml` — servicio `minio` con el bucket creado y con lectura
  pública, para que `MEDIA_BASE_URL` funcione sin CloudFront.
- `e2e/publish.spec.ts`, `e2e/photos.spec.ts` — la prueba de escape de ruta ya
  no aplica; entran las de claves ajenas e inexistentes.
- `Dockerfile` — quita `uploads/`.

## Explícitamente fuera

- Transcodificar el video (MediaConvert): S-28, con el worker.
- Borrar del bucket los archivos de publicaciones retiradas.
- Política de ciclo de vida del bucket: es infraestructura, S-29.
- Subir con barra de progreso. `fetch` con `PUT` no la da; se muestra "Subiendo…".

## Prueba de punta a punta

1. Un vendedor graba el video, agrega fotos y publica. La ficha muestra el video y
   las fotos servidos desde `MEDIA_BASE_URL`, no desde la aplicación.
2. Un borrador de tienda recibe su video por el mismo camino.
3. `/api/media/...` responde 404.

## Casos de fallo con prueba

Los de `claim` corren en `claim.test.ts` contra objetos reales en MinIO, subidos
por dos dueños distintos: la acción de servidor no se puede llamar por HTTP desde
Playwright sin imitar el protocolo interno de Next.

- Publicar con una clave que no existe en el bucket se rechaza.
- Publicar con la clave del video de **otro** vendedor se rechaza.
- Publicar con una clave de forma inválida (`../x`, sin extensión, ruta absoluta)
  se rechaza sin consultar el bucket.
- Una foto no pasa por video ni un video por foto.
- Firmar un tipo no permitido o un tamaño fuera de límite falla (unitaria).
- Un archivo que no es imagen se rechaza al firmar, con el mensaje de fotos (e2e).
- Un PUT con el dueño o el tamaño cambiados lo rechaza el bucket (comprobado a
  mano contra MinIO: 403; no está en la suite porque prueba a S3, no a nosotros).
- Pedir firma sin identidad aprobada: comparte la comprobación con
  `publishListing` y no tiene prueba propia.

## Depende de

S-26.
