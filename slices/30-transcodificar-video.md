# Rebanada S-30 — Transcodificar el video

El punto 2 de `ARQUITECTURA.md` 5.4. Lo que faltaba de la cola.

## Qué hace

El video que graba un vendedor llega en el formato que su navegador quiera:
WebM/VP8 en Android y Chrome, MP4/H.264 en iOS. Un comprador con iPhone no puede
ver un WebM. Desde esta rebanada, cada video subido se convierte a **MP4 H.264
720p con audio AAC**, que reproduce cualquier teléfono, y la ficha pasa a servir
esa versión cuando está lista. Mientras tanto sirve el original: el comprador con
el mismo tipo de teléfono que el vendedor lo ve igual que hoy.

## El flujo, sin Lambda

```
acción de publicar ──▶ SQS {transcodificar, clave}
                              │
                  worker: MediaConvert.CreateJob
                              │
S3 ◀── transcodificado/<clave>.mp4 ◀── MediaConvert ──COMPLETE──▶ EventBridge
                                                                     │
                                                    SQS {video_listo, original, salida}
                                                                     │
                                                worker: listings.video_path = salida
```

Quien sabe que hay un video nuevo es la acción de publicar, así que ella encola
`transcodificar`, igual que `avisar` (D-58). Eso evita una regla de S3 →
EventBridge que también se dispararía por portadas y fotos, y funciona igual en
el portátil. La única regla de EventBridge es la del `COMPLETE` de MediaConvert,
con un *input transformer* que arma el mensaje como `parseJob` lo entiende. Toda
la lógica sigue en el worker (regla 5).

## Por qué no un Lambda

Era la forma obvia: S3 → Lambda → CreateJob. Pero mete un segundo runtime con su
propio despliegue, sus propios registros y su propia versión del SDK para veinte
líneas. El worker ya existe, ya tiene rol, ya tiene registros y ya reintenta. Un
mensaje más en la cola no cuesta nada.

## En el portátil

MediaConvert no se puede correr en local. El proveedor vive detrás de una
interfaz (`src/features/video/provider.ts`) igual que pagos, identidad y envíos:
la implementación de prueba "termina" en el acto encolando `video_listo` con la
misma clave como salida. Se elige por configuración (`MEDIACONVERT_ROLE_ARN`
presente → real), no por `APP_ENV`: el entorno `dev` de la nube tiene
`APP_ENV=desarrollo` y ahí sí queremos MediaConvert de verdad.

## Idempotencia

- `transcodificar` repetido: MediaConvert crea dos trabajos y los dos escriben el
  mismo archivo de salida. Desperdicio, no error. Para evitarlo, antes de crear
  el trabajo el worker comprueba si la salida ya existe en el bucket.
- `video_listo` repetido: el `update` es idempotente (`where video_path = original
  or video_path = salida`).

## Archivos que toca

- `db/migrations/0009_video_original.sql` — `listings.video_original_path`.
- `src/features/video/provider.ts` — interfaz y las dos implementaciones.
- `src/features/video/queries.ts` — `markVideoReady(original, salida)`.
- `src/lib/queue.ts` — dos trabajos nuevos.
- `src/worker/handlers.ts` — dos casos nuevos.
- `src/lib/config.ts` — `MEDIACONVERT_ROLE_ARN` opcional.
- `src/features/publish/actions.ts` — encola `transcodificar` al publicar.
- `infra/modules/entorno/video.tf` — regla de EventBridge para el `COMPLETE`
  con su transformador, rol de MediaConvert, permisos del worker.
- `e2e/worker.spec.ts` — el circuito con el proveedor de prueba.
- `e2e/nube.spec.ts` — espera a que el video de la ficha pase a
  `transcodificado/…mp4`.

## Explícitamente fuera

- Miniatura generada por MediaConvert: la portada ya sale del navegador.
- Varias calidades (HLS). Un MP4 720p basta para un video de 30 segundos.
- Borrar el original después. Se queda, con su transición a acceso infrecuente.

## Prueba de punta a punta

1. Local, con el proveedor de prueba: se encola `transcodificar` para una
   publicación; el worker corre; la publicación tiene `video_original_path` y
   `video_path` apunta a la salida.
2. En la nube: la prueba de humo publica un WebM y, en menos de tres minutos, la
   ficha sirve `transcodificado/….mp4` con `content-type: video/mp4`.

## Casos de fallo con prueba

- `transcodificar` de una clave que no es de una publicación se descarta (e2e).
- `video_listo` repetido no rompe ni duplica.
- `transcodificar` repetido no crea un segundo trabajo si la salida ya existe
  (unitaria con el proveedor de prueba contando llamadas).

## Depende de

S-29.
