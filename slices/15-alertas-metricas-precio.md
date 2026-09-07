# Rebanada S-15 — Alertas, métricas y precio sugerido

## Qué hace

Tres funciones que la D-24 subió de prioridad baja a la versión 1:

- **Alertas de búsqueda guardada.** El comprador guarda una búsqueda y le avisamos
  cuando aparece algo que coincide.
- **Métricas del vendedor.** Vistas, favoritos y mensajes de cada publicación.
- **Precio sugerido.** Al publicar, un rango de referencia para no quedarse corto
  ni pasarse.

## Por qué van juntas

Las tres alimentan la misma cosa: que el vendedor y el comprador vuelvan. Ninguna
desbloquea nada, y por eso van al final.

## El precio sugerido, sin fingir que es un modelo

La D-24 habla de un modelo predictivo. No hay con qué entrenarlo: la plataforma no
tiene histórico. Lo que se hace es lo honesto: **el rango sale de lo que se ha
vendido de verdad en esa categoría y ese estado dentro de 2venta**, y si no hay
suficientes ventas, no se muestra nada.

Se necesitan al menos cinco ventas completadas para mostrar un rango. Con menos, un
promedio de dos ventas es ruido presentado como consejo, y un vendedor que fija su
precio por un dato inventado se lleva la peor parte.

Cuando haya volumen, este es el lugar donde entra un modelo de verdad.

## Las notificaciones, sin canal de salida

No hay proveedor de correo ni push conectado. Las alertas se generan y se guardan;
el usuario las ve al entrar. Conectar un canal es escribir la función de envío,
igual que con los SMS.

Esto es honesto pero incompleto: una alerta que hay que entrar a ver no sirve para
lo que existe, que es traer a la persona de vuelta.

## Archivos que toca

- `db/schema.sql` — `saved_searches`, `notifications`, `listing_views`
- `src/features/alerts/` — guardar búsquedas y generar avisos
- `src/features/metrics/` — vistas y estadísticas
- `src/features/pricing/` — el rango sugerido
- `e2e/alerts.spec.ts`

## Explícitamente fuera

- Envío real de correo o push.
- Modelo predictivo de precio.
- Métricas de conversión del vendedor más allá del conteo.
- Frecuencia configurable de alertas.

## Prueba de punta a punta

1. Un comprador guarda una búsqueda y recibe aviso cuando aparece algo que coincide.
2. El aviso respeta los filtros de la búsqueda guardada.
3. El vendedor ve vistas y favoritos de su publicación.
4. Con suficientes ventas, aparece el rango sugerido al publicar.
5. Sin suficientes ventas, no aparece nada en vez de un número inventado.

## Casos de fallo con prueba

- Una búsqueda guardada no avisa de la publicación del propio comprador.
- No se avisa dos veces de la misma publicación.
- Las vistas no cuentan las del propio vendedor.
- Una búsqueda guardada ajena no se puede ver ni borrar.

## Depende de

S-14.
