# Rebanada S-21 — Perfil editable, reportar usuario y suspender cuenta

## Qué hace

Tres requisitos que quedaron sin construir:

- **RF-12.** Editar el propio perfil: alias público, zona y descripción.
- **RF-32.** Reportar a un usuario o una conversación al equipo de moderación.
- **RF-41.** Suspender una cuenta que incumple los términos.

## Por qué van juntas

Las tres tocan la identidad de una persona dentro de la plataforma: cómo se
presenta, cómo se le denuncia y cómo se le saca.

## La decisión sobre qué hace una suspensión

Suspender **no borra nada**. La cuenta deja de poder entrar, sus publicaciones
dejan de verse, pero sus pedidos, conversaciones y calificaciones siguen existiendo.

Es lo mismo que con retirar una publicación (S-19), por la misma razón: al otro
lado de cada pedido hay alguien que no hizo nada malo. Si suspender borrara,
suspender a un estafador dejaría a sus víctimas sin evidencia justo cuando más la
necesitan.

Los pedidos en curso de una cuenta suspendida quedan intactos, incluidos los que
tienen dinero retenido. Ese dinero se resuelve por la vía normal: reclamo y
arbitraje.

## La decisión sobre el alias

El alias se puede cambiar, pero **queda registrado el anterior**. Un vendedor que
acumula malas reseñas no puede limpiar su rastro cambiándose el nombre, que es lo
primero que intentaría.

## Archivos que toca

- `db/migrations/0005_*.sql` — suspensión, descripción, historial de alias
- `src/features/profile/` — editar
- `src/features/moderation/` — reportar usuario, suspender
- `src/app/cuenta/editar/page.tsx`
- `src/app/admin/usuarios/page.tsx`
- `e2e/profile.spec.ts`

## Explícitamente fuera

- Foto de perfil. El RF-12 la menciona; necesita el mismo almacenamiento que las
  fotos de producto, que sigue siendo disco local.
- Levantar una suspensión desde la pantalla. Se hace en base de datos a propósito
  mientras no haya un procedimiento escrito.
- Suspensión temporal con fecha de fin.

## Prueba de punta a punta

1. Alguien edita su alias, su zona y su descripción, y se ve en su perfil público.
2. El alias anterior queda registrado.
3. Se reporta a un usuario y el reporte llega a la cola.
4. Un administrador suspende una cuenta.
5. La cuenta suspendida no puede entrar y sus publicaciones no se ven.
6. Los pedidos de la cuenta suspendida siguen existiendo para la otra parte.

## Casos de fallo con prueba

- Un alias vacío o demasiado largo se rechaza.
- No se puede editar el perfil de otro.
- Quien no es administrador no puede suspender, ni llamando la acción.
- No se puede reportar a uno mismo.
- Reportar dos veces al mismo usuario no duplica.

## Depende de

S-20.
