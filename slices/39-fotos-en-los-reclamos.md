# S-39 — Fotos como prueba en un reclamo

**Fecha:** 2026-09-21

## Por qué

Lo encontró Luna en la ronda del 2026-09-20 (hallazgo H-4): el chat deja adjuntar
fotos y el reclamo no, cuando el reclamo es justo donde una foto decide. Un reclamo
de «llegó, pero no es lo que decía la publicación» se resuelve comparando lo que
promete el video con lo que llegó, y hoy quien modera solo tiene el video del
vendedor y un párrafo escrito por el comprador. Una de las dos partes llega con
prueba y la otra con palabras.

## Qué se construye

- El comprador puede adjuntar **hasta tres fotos** al abrir el reclamo.
- El vendedor puede adjuntar **hasta tres** al responder.
- Las dos partes ven las fotos de la otra en la pantalla del pedido, y quien modera
  las ve en la cola de disputas junto al video.

## Por qué tres y por qué tabla

Tres porque un daño casi nunca se demuestra con una sola foto: la rotura, el
empaque y la etiqueta son tres cosas distintas. Tabla y no columnas porque las dos
partes aportan y el número es variable; dos columnas `foto_1..3` por lado serían seis
columnas para lo que es una lista. Es la diferencia con la D-92: un mensaje de chat
tiene como mucho una foto, un reclamo es un expediente.

## Archivos que toca

- `db/migrations/0014_fotos_en_los_reclamos.sql` (tabla `claim_photos`)
- `src/features/claims/{actions,queries,Forms}.tsx|ts`
- `src/app/pedido/[id]/page.tsx` y `src/app/admin/disputas/page.tsx`
- `src/components/Pruebas.tsx` (la tira de fotos, compartida por las dos pantallas)

## Qué queda fuera

- Vídeo en el reclamo. El video del artículo ya existe y es del vendedor; grabar otro
  desde el navegador es la S-02 entera otra vez.
- Borrar una foto ya enviada. Una prueba que se puede retirar después de que la otra
  parte la vio no es una prueba.
- Fotos en la resolución de quien modera. Decide, no aporta pruebas.

## Cómo se demuestra

Prueba de punta a punta en `e2e/claims.spec.ts`:

1. El comprador abre un reclamo con dos fotos y las ve en el pedido.
2. El vendedor las ve, responde con una foto suya, y el comprador la ve.
3. Quien modera ve las tres junto al video y resuelve.
4. La cuarta foto de un lado se rechaza en el servidor.
5. Una persona ajena al pedido no llega a las fotos.
