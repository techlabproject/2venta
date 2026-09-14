# S-32 — La ficha dice lo que el mockup prometía

## Por qué

La ficha del producto es donde se decide la compra, y es la pantalla que más se
alejó del mockup (1f). El mockup muestra tres cosas que hoy no están:

1. **Los atributos como distintivos**: «Usado bueno · IMEI validado», en vez de una
   lista de etiqueta y valor que se lee como una ficha técnica.
2. **La reputación del vendedor en la misma línea**: «4,8 ★ · 37 ventas · 0%
   disputas · Ver perfil». Hoy solo sale el alias y la zona.
3. **La cara del vendedor**, que existe desde S-31 y aquí no se usa.

El «IMEI validado» es el caso más claro de trabajo hecho sin cobrar: lo pedimos al
publicar, lo validamos con dígito de verificación, lo guardamos… y al comprador,
que es a quien le sirve saberlo, nunca se lo decimos.

Queda fuera el «Batería 89%» del mockup: no es un dato que el producto recoja, y
inventarlo en la pantalla sería mentirle al comprador sobre el estado del artículo.

## Alcance

- `LISTING_SELECT` devuelve la foto del vendedor y si la publicación tiene IMEI.
- Distintivos de atributo en la columna de compra.
- Bloque de vendedor con foto, alias, verificación y reputación.
- La D-17 deja pendiente qué mostrarle a un vendedor sin ventas. Se resuelve como
  ya lo resuelve su perfil: no se enseñan ceros, se dice que es nuevo y que su
  identidad está verificada.

## Qué queda fuera

- El atributo «Batería 89%»: no existe el dato.
- La galería con contador «1/6 · video»: el video con sus miniaturas ya funciona y
  cambiarlo es otra rebanada.

## Prueba de punta a punta

`e2e/ficha.spec.ts`:

1. Un artículo de tecnología con IMEI muestra «IMEI validado»; uno de ropa, no.
2. La ficha muestra el estado del artículo como distintivo.
3. Un vendedor con ventas muestra su calificación, sus ventas y su tasa de disputa.
4. Un vendedor sin ventas **no muestra ceros**: dice que es nuevo y que verificó su
   identidad.
