# Rebanada S-28 — Worker y cola

Los puntos 3 y 4 de la sección 9 de `ARQUITECTURA.md`, y la D-51.

## Qué hace

- Un **worker** que consume mensajes de una cola SQS y llama funciones de
  `src/features/*`. Es el mismo repositorio y la misma imagen de Docker, otro
  punto de entrada (`node worker.cjs`). No tiene lógica propia (regla 5 de
  convivencia): si alguna vez la tiene, ya se partió en dos sistemas.
- Dos trabajos pasan por la cola:
  1. **`liberar`** — la liberación automática a los siete días (D-11b). En AWS lo
     encola EventBridge Scheduler cada hora; el worker llama
     `releaseExpiredOrders()`. La ruta `POST /api/tareas/liberar` se conserva como
     palanca manual (D-51).
  2. **`avisar`** — los avisos a búsquedas guardadas cuando aparece una publicación.
     Hoy corren dentro de la acción de publicar y hacen esperar al vendedor por
     un trabajo que no le importa. La acción encola y responde.
- En el portátil la cola la da **ElasticMQ**, un servicio más en
  `docker-compose.yml`, con la misma API que SQS.
- `--una-vez`: el worker vacía la cola y sale. Es lo que usan las pruebas y una
  palanca de operación ("procesa lo que haya y termina").

## Por qué la cola y no un temporizador dentro de la aplicación

Con dos tareas web corriendo, un `setInterval` se dispara dos veces. Y un trabajo
que falla dentro de la petición del vendedor se pierde con ella. La cola da las dos
cosas que faltan: un solo consumidor por mensaje y reintento cuando falla.

## Idempotencia

SQS entrega **al menos una vez**. Los dos trabajos lo toleran por construcción:
`releaseExpiredOrders` pasa por `transition()`, que bloquea la fila y comprueba el
estado; `notifyMatchingSearches` tiene la restricción única
`(user_id, kind, subject_id)`. Un mensaje repetido no libera dos veces ni avisa dos
veces. Cualquier trabajo nuevo que entre a la cola tiene que poder decir lo mismo.

## Qué pasa cuando falla

Si el manejador lanza, el mensaje **no se borra**: SQS lo vuelve a entregar cuando
vence su ventana de visibilidad, y después de N intentos lo manda a la cola de
mensajes fallidos (infraestructura, S-29). Un mensaje que falla en silencio, en este
dominio, es un pago que no se liberó; por eso la alarma sobre esa cola es la
primera de la lista en `ARQUITECTURA.md` 5.7.

Si **encolar** falla al publicar, la publicación sale igual y el error queda en el
registro. Un aviso que no se manda es peor que nada, pero una publicación que no
sale porque la cola estaba caída es peor que eso.

## Archivos que toca

- `src/lib/queue.ts` — nuevo: tipos de mensaje, `enqueue`, cliente de SQS. Es la
  única pieza que sabe que existe una cola.
- `src/worker/index.ts` — nuevo: bucle de consumo, `--una-vez`.
- `src/worker/handlers.ts` — nuevo: un `switch` que llama a features.
- `src/features/alerts/queries.ts` — `notifyForListing(id)` carga la publicación
  y llama a lo que ya existe.
- `src/features/publish/actions.ts` — encola en vez de avisar en línea.
- `src/lib/config.ts` — `SQS_QUEUE_URL`; `SQS_ENDPOINT` opcional.
- `package.json` — `build:worker` (esbuild a un solo archivo), `worker`.
- `Dockerfile` — copia `worker.cjs`.
- `docker-compose.yml` — servicio `elasticmq`.
- `e2e/helpers.ts` — `runWorkerOnce()`, `enqueue()`.
- `e2e/alerts.spec.ts` — corre el worker después de publicar.
- `e2e/worker.spec.ts` — nuevo.

## Explícitamente fuera

- Transcodificar el video con MediaConvert. Necesita AWS de verdad para probarse;
  entra cuando exista el bucket real, como rebanada propia después de S-29.
- La cola de mensajes fallidos y el programador: son infraestructura, S-29.
- Cualquier otro trabajo en segundo plano. Solo entran los dos que ya existían.

## Prueba de punta a punta

1. Un pedido entregado hace ocho días; se encola `liberar`; el worker corre una
   vez; el pedido queda `liberado` sin tocar `/api/tareas/liberar`.
2. Un comprador con búsqueda guardada; un vendedor publica; el worker corre una
   vez; el aviso aparece.
3. La ruta manual sigue existiendo y sigue exigiendo el secreto.

## Casos de fallo con prueba

- Un mensaje con forma desconocida no tumba el worker: se descarta con registro
  y se borra (reintentarlo no lo va a arreglar).
- Un mensaje repetido de `liberar` no libera dos veces (el segundo devuelve 0).
- Un `avisar` de una publicación que no existe se descarta sin error.

## Depende de

S-27.
