# Informe de segunda vuelta — corrección «Volver»

**Veredicto: NO PASA** — los dos hallazgos originales y «Esta publicación no es tuya» quedaron resueltos, pero una persona con una conversación previa sobre un artículo retirado no puede volver a ver la ficha ni el botón «Escribirle al vendedor», aunque el chat sí se conserva como se acordó.

## Hallazgos

1. **Severidad: media — la conversación previa se conserva, pero la ficha retirada no queda disponible para esa persona.**

   **Ancho:** 390 px.

   **Pasos exactos:**

   1. Entrar como `laura@2venta.demo` con contraseña `Demo2venta.2026`.
   2. Abrir `/chat/abrir/2a7b9654-04a0-46c2-968b-e1913c386c4d`, el artículo retirado «Coche Chicco reclinable», sobre el que Laura ya tenía una conversación.
   3. Desde el chat, pulsar el enlace del artículo «Coche Chicco reclinable».

   **Esperado:** conservar el acceso a la ficha para esa persona y mostrar allí «Escribirle al vendedor»; el chat previo debe seguir abriendo, pero sin «Hacer una oferta».

   **Visto:** el paso 2 sí abrió el chat `http://localhost:3100/chat/26acf1c0-80d2-498c-99f0-4da0a099be29` y no mostró «Hacer una oferta». El enlace de la cabecera tenía destino `/producto/2a7b9654-04a0-46c2-968b-e1913c386c4d`, pero al pulsarlo terminó en `http://localhost:3100/producto/2a7b9654-04a0-46c2-968b-e1913c386c4d`, con encabezado exacto «No pudimos abrir esto» y sin el botón «Escribirle al vendedor» (`0` botones encontrados).

   **Captura:** [v2-retirado-ficha-desde-chat-390.png](capturas/v2-retirado-ficha-desde-chat-390.png)

## Lo que verifiqué y pasa

- Hallazgo original 1 resuelto: un artículo retirado sin conversación previa, abierto con `luna.buyer.7757706@2venta.demo`, llevó a `http://localhost:3100/producto/2a7b9654-04a0-46c2-968b-e1913c386c4d`, mostró «No pudimos abrir esto», no mostró «Escribirle al vendedor» y sí mostró «Volver». Lo mismo ocurrió con el retirado «iPhone 13 128 GB».
- Hallazgo original 2 resuelto: el 404 `http://localhost:3100/producto/00000000-0000-0000-0000-000000000000` mostró «No pudimos abrir esto» y «Volver»; «Volver» llevó a `http://localhost:3100/`.
- «Esta publicación no es tuya» ahora muestra «Volver». En una pestaña nueva, `http://localhost:3100/producto/d859b4a8-2db2-409d-84ad-e38a3b2390c9/editar` mostró el encabezado exacto y «Volver» llevó a la ficha `http://localhost:3100/producto/d859b4a8-2db2-409d-84ad-e38a3b2390c9`.
- Artículo reservado: cambié temporalmente «Triciclo rojo para niños de 2 a 4 años» a `reservada`. La ficha mostró «Escribirle al vendedor»; el POST real del botón abrió `http://localhost:3100/chat/f5f7fe38-ed85-4d71-bdda-788dd7b205bf` y no mostró «Hacer una oferta». Después restauré el estado a `activa`.
- Artículo reservado activo de nuevo: el mismo chat volvió a mostrar «Hacer una oferta», confirmando que el enlace depende del estado `activa`.
- Artículo vendido sin conversación previa: cambié temporalmente «Gafas de sol estilo aviador, marco dorado» a `vendida`. `/chat/abrir/<id>` llevó a su ficha, sin «Escribirle al vendedor» y con «Volver». Restauré el estado a `activa`.
- Artículo vendido con conversación previa: «Guante de béisbol juvenil, cuero» se marcó temporalmente como `vendida`. Con Laura, el chat existente `http://localhost:3100/chat/8788d3f0-171e-4c73-bab2-07e2fd625b3e` siguió abriendo; la ficha conservó «Escribirle al vendedor»; el POST desde esa ficha volvió al chat y «Hacer una oferta» no apareció. Restauré el estado a `activa`.
- Rutas de error probadas —chat inválido, oferta inválida, pedido inexistente, edición/publicación inválida, vendedor inexistente y `/admin` sin permisos— mostraron «No pudimos abrir esto» con «Volver».
- Estados vacíos de carrito, guardados, avisos y actividad conservaron «Volver».
- El recorrido principal sigue funcionando: sin sesión → ficha «Atrapasueños para cuarto de bebé» → «Escribirle al vendedor» → `http://localhost:3100/ingresar?motivo=chat&volver=%2Fchat%2Fabrir%2F95950ecc-fcda-401d-9d90-16262cb72545` → entrar con Laura → `http://localhost:3100/chat/fc4e5eb9-905d-4078-8c3f-ed871336dadc`.
- Capturas adicionales: [v2-retirado-sin-conv-390.png](capturas/v2-retirado-sin-conv-390.png), [v2-retirado-conv-previa-chat-390.png](capturas/v2-retirado-conv-previa-chat-390.png), [v2-reservado-ficha-390.png](capturas/v2-reservado-ficha-390.png), [v2-reservado-chat-390.png](capturas/v2-reservado-chat-390.png), [v2-vendido-conv-previa-chat-390.png](capturas/v2-vendido-conv-previa-chat-390.png), [v2-vendido-conv-previa-post-390.png](capturas/v2-vendido-conv-previa-post-390.png), [v2-vendido-sin-conv-390.png](capturas/v2-vendido-sin-conv-390.png), [v2-no-encontrado-390.png](capturas/v2-no-encontrado-390.png), [v2-editar-ajena-390.png](capturas/v2-editar-ajena-390.png) y [v2-recorrido-principal-390.png](capturas/v2-recorrido-principal-390.png).

## NO VERIFICADO

- Artículo en revisión: no había uno disponible para probarlo sin alterar datos adicionales.
- Cuenta suspendida y flujo de suspensión.
- Pedido real con `/pedido/<id>` y estados de pago.
- Varias pestañas simultáneas y recarga en mitad del recorrido.
