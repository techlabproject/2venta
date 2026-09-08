# Rebanada S-23 — Fotos del artículo

## Qué hace

Además del video obligatorio, el vendedor agrega hasta seis fotos. La ficha las
muestra junto al video.

## Por qué

Es el RF-15, que hablaba de "hasta un máximo de fotos definido" y quedó sin
construir. Hoy la ficha solo muestra el cuadro de portada sacado del video, que
sirve para probar que el artículo existe pero no para verlo bien.

En ropa importa especialmente: nadie compra una chaqueta por un cuadro borroso de
un video de treinta segundos.

## La decisión: las fotos SÍ se pueden subir de la galería

El video no (D-14), las fotos sí. No es una inconsistencia: son dos cosas distintas.

**El video prueba que el artículo existe y está en manos del vendedor.** Por eso se
graba en vivo, y por eso la galería no es una fuente válida.

**Las fotos son presentación.** Una foto buena, tomada con luz, desde el ángulo que
muestra el detalle, sirve para vender, y exigir que se tomen dentro de la app solo
las haría peores sin agregar ninguna garantía. La garantía ya la da el video.

Dicho de otro modo: si alguien pone fotos de un producto que no tiene, el video lo
delata. Y si el video coincide, las fotos no engañan a nadie.

## Archivos que toca

- `db/migrations/0007_*.sql` — tabla `listing_photos`
- `src/features/publish/` — subir y ordenar
- `src/app/producto/[id]/page.tsx` — la galería
- `src/features/catalog/` — la portada pasa a ser la primera foto si hay
- `e2e/photos.spec.ts`

## Explícitamente fuera

- Reordenar las fotos arrastrando.
- Recortar o rotar dentro de la app.
- Fotos en los borradores de carga en lote.

## Prueba de punta a punta

1. Se publica con tres fotos y la ficha las muestra.
2. La primera foto pasa a ser la portada en el catálogo.
3. Sin fotos, la portada sigue siendo el cuadro del video.

## Casos de fallo con prueba

- Más de seis fotos se rechazan.
- Un archivo que no es imagen se rechaza.
- Una imagen demasiado pesada se rechaza.
- Las fotos de una publicación ajena no se pueden borrar.

## Depende de

S-22.
