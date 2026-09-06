# Rebanada S-03 — Publicar con video obligatorio

## Qué hace

Un vendedor con identidad verificada publica un artículo: título, categoría,
precio, estado, descripción y un video grabado dentro de la app. El video no es
opcional y no se puede subir desde la galería. De ese video se extrae un cuadro que
queda como imagen de portada en el feed.

## Por qué va en este momento

Es la D-14 y el diferenciador del producto: la prueba de que el artículo existe y
está como dice. Aquí además aterriza R-01, el riesgo número uno del proyecto.

Sobre R-01, la respuesta que se implementa: grabar con `getUserMedia` más
`MediaRecorder` no es cargar un archivo, es consumir el flujo en vivo de la cámara.
La galería no es una fuente posible por construcción, no por una validación que
alguien pueda saltarse desde las herramientas del navegador.

## Archivos que toca

- `db/schema.sql` — `listings` gana `video_path`, `poster_path` y `status`
- `src/features/publish/` — captura de video, formulario y acción de publicar
- `src/app/publicar/page.tsx`
- `src/app/api/media/` — recibir y servir archivos
- `src/lib/storage.ts` — dónde viven los archivos
- `e2e/publish.spec.ts`

## Explícitamente fuera

- Fotos adicionales además del cuadro de portada. El mockup las muestra; se agregan
  cuando haya almacenamiento de verdad.
- Almacenamiento en la nube y transcodificación. Los archivos van a disco local
  detrás de una interfaz propia; el servicio real entra sin tocar pantallas.
- Editar y borrar publicaciones, marcar como vendida o reservada. Son RF-16 y
  RF-17, van en su propia rebanada.
- Verificación de IMEI. Es S-10.
- Precio sugerido por modelo. Es S-15.

## Prueba de punta a punta

`npm run verify`, con cámara simulada del navegador. Comprueba:

1. Un vendedor verificado graba, completa el formulario y publica; el artículo
   aparece en el feed con su imagen de portada.
2. La ficha del artículo reproduce el video.

## Casos de fallo con prueba

- Sin video no se puede publicar, y el servidor lo rechaza aunque se salte la
  pantalla.
- Un vendedor sin verificar no puede publicar, ni desde la pantalla ni llamando
  directamente a la acción.
- Sin sesión no se puede publicar.
- Un precio de cero o negativo se rechaza.
- Un archivo que no es video se rechaza.
- Un archivo más grande que el límite se rechaza.

## Decisiones de la lista de zonas sensibles

- La comprobación de que el vendedor está verificado ocurre en el servidor, dentro
  de la acción. La pantalla que esconde el botón no cuenta como control de acceso.
- El nombre del archivo lo genera el servidor. Nunca se usa el que manda el
  cliente: un nombre con `../` escaparía del directorio de subidas.
- El tipo y el tamaño se comprueban en el servidor.
- El precio se guarda como entero en pesos, con la comprobación de positivo en la
  base de datos y no solo en la aplicación.

## Depende de

S-02.
