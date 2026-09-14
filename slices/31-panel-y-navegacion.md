# S-31 — El vendedor gestiona, la navegación se ordena, la cuenta tiene cara

## Por qué

Tres cosas que Nicolás reportó usando la aplicación el 2026-09-13, después de la
ronda de diseño:

1. Un vendedor todavía no tiene **un sitio donde gestionar lo que tiene publicado**.
   `/vender/metricas` enseña cifras, pero desde ahí no se puede reservar, retirar,
   reactivar ni editar nada: hay que ir artículo por artículo a la ficha pública.
2. La cabecera es **una fila de enlaces subrayados, todos iguales**. En un celular
   se parte en dos filas y no se lee como navegación.
3. En un monitor **todo sigue dibujado en una columna angosta**. El feed y la ficha
   ya se arreglaron (D-70), pero el panel del vendedor, sus publicaciones y la
   cuenta siguen en `max-w-md`.

Y una cuarta que faltaba desde siempre: **no se puede poner una foto de perfil**. En
un mercado donde el argumento es «confía en este desconocido», la cara del vendedor
no es decoración.

## Alcance

- Migración `0011_foto_de_perfil.sql`: `user.avatar_path`.
- Subida de la foto de perfil por URL prefirmada, reutilizando D-50 y `claim()`.
  A diferencia de publicar, **no exige identidad verificada**: un comprador también
  tiene cara.
- `<Avatar>`: foto o iniciales sobre el verde de marca.
- `AppHeader` con menú: hamburguesa en móvil, barra con grupos en escritorio.
- `/vender/metricas` pasa de tablero de cifras a **gestión**: portada, precio,
  estado, cifras y las acciones de cada publicación en el mismo sitio.
- Anchos de escritorio en `/vender`, `/vender/metricas` y `/cuenta`.

## Qué queda fuera

- Recortar la foto en el navegador. Se sube tal cual y se muestra recortada por CSS.
- Borrar del bucket la foto anterior al cambiarla (es la misma deuda que las
  publicaciones retiradas, anotada en `NOTES.md`).
- Renombrar la ruta `/vender/metricas`: el nombre queda, el contenido cambia.

## Prueba de punta a punta

`e2e/panel-vendedor.spec.ts`:

1. Una vendedora verificada publica un artículo.
2. Llega a `/vender/metricas` **siguiendo solo enlaces visibles** desde la portada.
3. Ve la portada del artículo, su precio y su estado «Activa».
4. Lo marca como reservado desde ahí mismo y la tarjeta pasa a «Reservada».
5. Lo vuelve a publicar y queda «Activa».
6. Sube una foto de perfil y la ve en la cabecera y en su cuenta.
7. Con la ventana en 390 px, la navegación está detrás de un único botón «Menú».
