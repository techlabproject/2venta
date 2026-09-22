# Informe de tercera vuelta — tarjeta de artículo en chats

**Veredicto: PASA CON OBSERVACIONES** — las ramas comprobables funcionan: el artículo retirado deja de ser enlace para Laura y muestra «· Ya no está publicado»; los artículos activos y vendidos siguen enlazados; el compositor permanece visible en 390 px. No pude autenticar al vendedor seed real de «Coche Chicco reclinable» para comprobar su rama.

## Hallazgos

No se observaron defectos reproducibles en las ramas ejecutadas.

## Lo que verifiqué y pasa

- **Laura + artículo retirado:** en `http://localhost:3100/chat/26acf1c0-80d2-498c-99f0-4da0a099be29`, la tarjeta fue un `DIV` sin `href`. Texto exacto observado: «Coche Chicco reclinable$ 260.000 · Hablas con Camila R. · Ya no está publicado». No se mostró enlace a la ficha.
- **Artículo activo:** en `http://localhost:3100/chat/fc4e5eb9-905d-4078-8c3f-ed871336dadc`, la tarjeta fue un enlace a `/producto/95950ecc-fcda-401d-9d90-16262cb72545` con el texto «Atrapasueños para cuarto de bebé$ 35.000 · Hablas con Andrés M.»
- **Artículo vendido:** marqué temporalmente como `vendida` «Guante de béisbol juvenil, cuero». En `http://localhost:3100/chat/8788d3f0-171e-4c73-bab2-07e2fd625b3e`, la tarjeta siguió siendo un enlace a `/producto/d859b4a8-2db2-409d-84ad-e38a3b2390c9`, con el texto «Guante de béisbol juvenil, cuero$ 70.000 · Hablas con Camila V.» Después restauré el estado a `activa`.
- **Compositor en 390 px:** en los chats retirado, activo y vendido, el campo `Mensaje` quedó visible; su límite inferior fue `y=779.5` dentro de un viewport de 844 px, sin desbordamiento horizontal (`scrollWidth=390`).
- Capturas: [v3-laura-retirado-390.png](capturas/v3-laura-retirado-390.png), [v3-laura-activo-390.png](capturas/v3-laura-activo-390.png), [v3-laura-vendido-390.png](capturas/v3-laura-vendido-390.png).

## NO VERIFICADO

- **Camila como dueña de «Coche Chicco reclinable»:** la publicación pertenece al usuario seed `camila@ejemplo.co` («Camila R.»), mientras que la cuenta entregada `camila@2venta.demo` («Camila V.») es otra persona y no puede abrir esa conversación. La cuenta seed no tiene contraseña para iniciar sesión como una persona. Al probar con `camila@2venta.demo`, la URL `http://localhost:3100/chat/26acf1c0-80d2-498c-99f0-4da0a099be29` mostró «No pudimos abrir esto» por no ser participante.
