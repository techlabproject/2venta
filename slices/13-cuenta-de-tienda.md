# Rebanada S-13 — Cuenta de tienda

## Qué hace

Un vendedor puede registrar su cuenta como tienda con NIT. La tienda tiene su propio
distintivo en el catálogo y en el perfil, y puede publicar varios artículos de una
vez desde un archivo, en vez de uno por uno.

## Por qué va en este momento

Es la D-07, y es la rebanada que hace viable traer casas de empeño y tiendas
pequeñas, que era una de las oportunidades que detectó tu investigación. Un negocio
con cincuenta equipos no va a grabar cincuenta videos de a uno por la interfaz de
móvil.

Su fecha real depende de la estrategia de arranque en frío, que sigue sin decidirse.
Lo que se construye aquí es la capacidad; cuándo se usa es otra conversación.

## La tensión con el video obligatorio

La publicación en lote choca de frente con la D-14: el video se graba dentro de la
app y no se sube. Si una tienda pudiera cargar cincuenta artículos con sus videos
desde un archivo, la garantía se cae.

Lo que se hace: **el lote crea borradores, no publicaciones.** La tienda carga
título, categoría, precio, estado, descripción e IMEI de una vez, y después graba el
video de cada uno desde el móvil. Se ahorra el trabajo de escribir, que es el que
de verdad cuesta en volumen, sin tocar la garantía.

Es más lento que lo que pediría una tienda, y es a propósito.

## Archivos que toca

- `db/schema.sql` — datos de tienda en `user`, estado `borrador` en `listings`
- `src/features/store/` — registro de tienda y carga en lote
- `src/app/tienda/` — las pantallas
- `src/features/catalog/` — el distintivo de tienda
- `e2e/store.spec.ts`

## Explícitamente fuera

- Validar el NIT contra la DIAN. No hay acceso; se guarda con su formato
  comprobado y la verificación de identidad del representante sigue siendo la del
  proveedor externo.
- Facturación electrónica. Es un requisito real para una tienda formal y necesita
  su propia rebanada.
- Retenciones tributarias distintas para persona jurídica. Está anotado como
  consecuencia de la D-07 y sigue sin resolverse.
- Catálogo propio con su dominio.

## Prueba de punta a punta

1. Un vendedor verificado registra su cuenta como tienda con NIT.
2. El distintivo de tienda aparece en su perfil y en sus publicaciones.
3. Carga un archivo con tres artículos y quedan como borradores.
4. Un borrador no aparece en el catálogo hasta que se le graba el video.
5. Grabado el video, el borrador sigue el mismo camino que cualquier publicación,
   incluida la revisión de electrónica.

## Casos de fallo con prueba

- Un NIT con formato inválido se rechaza.
- Un NIT ya registrado en otra cuenta se rechaza.
- Sin identidad verificada no se puede registrar tienda.
- Un archivo con columnas equivocadas se rechaza con un mensaje que dice cuáles
  faltan.
- Una fila con precio inválido no crea el borrador, y las demás sí.
- Un archivo con más de cien filas se rechaza.
- Quien no es tienda no puede usar la carga en lote.

## Depende de

S-12.
