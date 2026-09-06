# Estado

**Última actualización:** 2026-09-06

## En qué voy

Rebanada S-00 cerrada. Las cinco pruebas de punta a punta pasan, tipos y linter
limpios. Falta el paso 6 del ciclo: la revisión con contexto fresco contra
`slices/00-esqueleto-caminante.md`.

Siguiente: S-01, cuenta con teléfono verificado. Es zona sensible.

## Qué quedó a medias

- El despliegue a producción quedó fuera de S-00 a propósito: necesita cuentas que
  todavía no existen (alojamiento, base de datos gestionada, proveedor de SMS).
- La forma congelada por S-00 y que las siguientes rebanadas deben copiar:
  una carpeta por funcionalidad en `src/features/`, las consultas de base de datos
  en `queries.ts` dentro de esa carpeta, las pantallas en `src/app/` sin lógica
  propia, y una prueba de punta a punta por rebanada en `e2e/`.

## Qué aprendí que no está en ningún otro archivo

- Docker Desktop está instalado pero el daemon no arranca solo. Hay que abrirlo
  antes de `docker compose up`.
- No hay Xcode completo, solo Command Line Tools, y no hay Android Studio. No
  bloquea nada hasta que toque empaquetar para las tiendas.
- Node 26 y npm 11 disponibles. Next 16.3.4.
- `dotenv` no lee `.env.local`, eso solo lo hace Next. Los scripts fuera de Next
  tienen que pasarle la ruta explícita o fallan conectando al puerto por defecto.
- El puerto 3000 lo ocupa Docker en esta máquina; el servidor de desarrollo usa
  puerto asignado automáticamente.
- El repositorio vive en `~/Downloads/2venta`, que es un mal sitio permanente.
  Moverlo es un `mv` y no rompe nada.

## Preguntas abiertas que bloquean el lanzamiento, no el desarrollo

- Estrategia de arranque en frío: sin decidir.
- R-02: falta confirmar con Mercado Pago si la retención se puede condicionar a un
  evento propio o solo a un calendario fijo.
- R-03: falta averiguar si hay convenio posible para consultar IMEI de forma
  automatizada.
- R-04: falta confirmar que el agregador logístico notifique la entrega por webhook.
- Qué se le muestra al comprador sobre un vendedor nuevo mientras acumula
  calificaciones (consecuencia de D-17).

## Siguiente paso concreto

Levantar Postgres, crear el esquema con `sellers` y `listings`, sembrar tres
productos y hacer que la lista los muestre.
