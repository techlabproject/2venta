# Informe de prueba independiente — fila 17

Fecha: 24 de septiembre de 2026. Navegador real Chromium. Anchos usados: 390 px y 1280 px.

## Veredicto

**PASA CON OBSERVACIONES** — la regla de negocio se respeta en las fichas, el carrito, las rutas directas y las acciones de servidor; quedan controles visibles y confusos en una conversación y en pestañas abiertas antes de cambiar la cuenta a empresa.

## Hallazgos

1. **Media — una empresa puede abrir el flujo de oferta en una conversación que ya existía.**

   - **Ancho:** 390 px.
   - **Pasos exactos:** crear una cuenta nueva; desde `http://localhost:3100/producto/302ee45a-287a-46b6-91bf-8391a08dcb6a` pulsar «Escribirle al vendedor» y enviar «Hola, escribo antes de elegir vender como empresa.»; volver a `http://localhost:3100/vender?tipo=juridica`, elegir «Como empresa», completar los datos, adjuntar `rut-prueba.pdf` y llegar a `http://localhost:3100/dev/kyc/ref_9c7e4275-5e4f-4048-b14d-93f3d80ee334?u=ywGLBsqqvvMRSlmPBCSM2AeBa8HjfoNQ`; abrir `http://localhost:3100/chats`; abrir la conversación de «Control DualShock 4 original, negro»; pulsar «Hacer una oferta», escribir `130000` y pulsar «Enviar la oferta».
   - **Esperado:** la conversación previa se conserva, pero una cuenta de empresa no muestra ni permite ofertas porque es la compradora.
   - **Visto:** la conversación se conserva en `http://localhost:3100/chat/964d719b-3e98-4261-a52f-e61f6d1bc7e9` y sigue mostrando el enlace exacto «Hacer una oferta». El formulario queda en `http://localhost:3100/chat/964d719b-3e98-4261-a52f-e61f6d1bc7e9/oferta` con el texto exacto «Esta es una cuenta de empresa: en 2venta las empresas venden, pero no compran.», el campo «Cuánto ofreces» y el botón «Enviar la oferta». El servidor rechazó la oferta y no apareció una oferta nueva en el chat, pero la acción se presenta como disponible.
   - **Captura:** [C-empresa-oferta-chat-previo.png](capturas/C-empresa-oferta-chat-previo.png) y [C-chat-conservado-detalle-empresa.png](capturas/C-chat-conservado-detalle-empresa.png).

2. **Media — las pestañas abiertas antes de convertirse en empresa conservan controles de compra visibles.**

   - **Ancho:** 390 px.
   - **Pasos exactos:** con la cuenta todavía compradora, abrir `http://localhost:3100/producto/302ee45a-287a-46b6-91bf-8391a08dcb6a` y `http://localhost:3100/comprar/302ee45a-287a-46b6-91bf-8391a08dcb6a` en pestañas separadas; en otra pestaña elegir «Como empresa» en `http://localhost:3100/vender?tipo=juridica`; en la ficha vieja pulsar «Agregar al carrito» y «Escribirle al vendedor»; en el checkout viejo pulsar «Ir a pagar».
   - **Esperado:** ninguna pestaña vieja debe dejar la impresión de que aún se puede comprar; las acciones deben desaparecer o quedar claramente deshabilitadas.
   - **Visto:** en la ficha vieja, que permanece en `http://localhost:3100/producto/302ee45a-287a-46b6-91bf-8391a08dcb6a`, aparece el texto exacto «Esta es una cuenta de empresa: en 2venta las empresas venden, pero no compran.» pero también vuelven a verse «Agregar al carrito» y «Escribirle al vendedor». En el checkout viejo, que permanece en `http://localhost:3100/comprar/302ee45a-287a-46b6-91bf-8391a08dcb6a`, aparece el mismo aviso junto con los campos de entrega y «Ir a pagar». Las acciones fueron rechazadas por el servidor: no quedó artículo en `http://localhost:3100/carrito`, no apareció pedido en `/actividad` y `/chats` mostró «Todavía no has hablado con nadie».
   - **Captura:** [C-empresa-pestana-vieja-agregar.png](capturas/C-empresa-pestana-vieja-agregar.png), [C-empresa-pestana-vieja-pagar.png](capturas/C-empresa-pestana-vieja-pagar.png) y [C-empresa-carrito.png](capturas/C-empresa-carrito.png).

3. **Baja — el aviso prohíbe comprar, pero no explica qué hacer si la empresa necesita comprar.**

   - **Ancho:** 390 px; también observado a 1280 px en la ficha.
   - **Pasos exactos:** convertir una cuenta en empresa; abrir `http://localhost:3100/producto/302ee45a-287a-46b6-91bf-8391a08dcb6a`, `http://localhost:3100/carrito` y probar `http://localhost:3100/comprar/302ee45a-287a-46b6-91bf-8391a08dcb6a`.
   - **Esperado:** además de explicar la restricción, el texto debería orientar a la persona sobre la alternativa para comprar.
   - **Visto:** el texto exacto es «Esta es una cuenta de empresa: en 2venta las empresas venden, pero no compran.» En `/carrito` queda además el enlace «Ir a vender». El tono es directo y comprensible, pero no hay una instrucción para resolver la necesidad de compra.
   - **Captura:** [C-empresa-ficha-390.png](capturas/C-empresa-ficha-390.png), [C-empresa-carrito.png](capturas/C-empresa-carrito.png) y [C-empresa-ficha-1280.png](capturas/C-empresa-ficha-1280.png).

## Lo que verificaste y pasa

- **Persona natural que vende — Camila, 390 px:** en `http://localhost:3100/actividad`, antes de comprar vio «Ventas» y «Aquí van tus ventas», sin «Compras». Desde `http://localhost:3100/producto/837d11a8-b8b8-460d-854b-6f5b683460c5` pudo abrir `http://localhost:3100/chat/79168cbd-2758-4216-8f6c-534e337a4a7f`, enviar «Hola, ¿sigue disponible? Me interesa.» y ofertar; el chat mostró exactamente «OFRECISTE», «$ 30.000» y «Esperando respuesta». En `http://localhost:3100/producto/5a1ba206-c024-4984-a87b-0dfe2a3d7ec5` pudo agregar al carrito, ir a `/comprar/carrito`, llegar a `http://localhost:3100/dev/pago/c14364a8-47c2-424e-ba33-a7355ea0eb6c` y pulsar «Simular pago aprobado». Terminó en `http://localhost:3100/pedido/c14364a8-47c2-424e-ba33-a7355ea0eb6c`; después `/actividad` mostró «Compras», «Tornamesa Audio-Technica LP60» y «Conversaciones».
- **Compradora pura — Laura, 390 y 1280 px:** `http://localhost:3100/actividad` mostró solo «Compras» y «Aquí van tus compras», sin sección «Ventas». La cuenta demo no tenía pedidos. Una cuenta nueva sin vender repitió ese estado y, después de comprar «Atrapasueños para cuarto de bebé» y aprobar el pago en `http://localhost:3100/dev/pago/08ae7b1a-7815-4e45-b1d9-f6d15f122a03`, `http://localhost:3100/actividad` mostró el pedido bajo «Compras» y siguió sin «Ventas».
- **Empresa — 390 y 1280 px:** tras elegir «Como empresa», incluso antes de confirmar el NIT, la ficha fresca en `http://localhost:3100/producto/302ee45a-287a-46b6-91bf-8391a08dcb6a` mostró el aviso exacto y no mostró «Comprar con pago protegido», «Agregar al carrito» ni «Escribirle al vendedor». El menú móvil y el de escritorio no mostraron «Carrito» y cambiaron «Compras y ventas» por «Tus ventas». `/actividad` mostró solo «Ventas» y «Aquí van tus ventas».
- **Rutas y carrito de empresa:** `/comprar/302ee45a-287a-46b6-91bf-8391a08dcb6a` volvió a la ficha; `/chat/abrir/302ee45a-287a-46b6-91bf-8391a08dcb6a` volvió a la ficha; `/comprar/carrito` volvió a `http://localhost:3100/carrito`. Un carrito creado antes de convertirse en empresa dejó de mostrar el artículo y mostró el aviso exacto en `/carrito`; tampoco pudo entrar al pago.
- **Conservación de conversación:** un chat creado antes de elegir «Como empresa» siguió visible en `/chats` y en `/chat/964d719b-3e98-4261-a52f-e61f6d1bc7e9`; no se creó una conversación nueva al pulsar el control viejo.
- **KYC y estado vendedor:** una cuenta de empresa llegó a `/dev/kyc`, se aprobó con «Simular aprobación» y `/vender` mostró «Tu espacio de vendedor», «Identidad verificada» y «Publicar un artículo». La restricción de compra siguió vigente después de aprobar.

## Observaciones fuera de alcance

- En la ficha demo de tecnología se muestran «Preguntas» y «Reportar esta publicación»; no evalué esas funciones en esta fila.

## NO VERIFICADO

- **Empresa con publicación propia, ventas y chats como vendedora:** no llegué a publicar. Después de aprobar el KYC, `/publicar` quedó en «Abrir cámara»; al pulsarlo el navegador no entregó cámara, no apareció «Video listo» y no se pudo completar el formulario ni crear una publicación. Por eso no afirmo que sus publicaciones, ventas o chats de vendedor funcionen.
- **Flujo de rechazo del KYC:** no ejecutado; solo se probó la aprobación simulada.
