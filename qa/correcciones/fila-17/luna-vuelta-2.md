# Informe de prueba independiente — fila 17, segunda vuelta

Fecha: 24 de septiembre de 2026. Navegador real Chromium. Anchos usados: 390 px y 1280 px.

## Veredicto

**PASA** — los tres hallazgos anteriores quedaron corregidos; no encontré regresiones en los recorridos repetidos de compra natural, compradora pura, empresa, carrito, chat, oferta ni actividad.

## Hallazgos

Ninguno en esta vuelta.

## Lo que verificaste y pasa

- **Conversación previa y oferta aceptada — 390 y 1280 px:** antes de convertirse, la compradora vio en `http://localhost:3100/chat/cf3a1a09-6724-4767-9f7d-6bd839d650ba` los textos exactos «Te aceptaron la oferta de $ 130.000» y «Pagar $ 130.000». Después de elegir «Como empresa», el mismo chat conservó la conversación y la oferta aceptada, pero ya no mostró «Pagar $ 130.000» ni «Hacer una oferta». Mostró el aviso exacto: «Esta es una cuenta de empresa: en 2venta las empresas venden, pero no compran. Si quieres comprar algo, hazlo desde una cuenta personal, con otro celular.» No se creó pedido.
- **Panel `/chat/<id>/oferta` — 390 y 1280 px:** con una conversación previa sin oferta, dejé abierto `http://localhost:3100/chat/e6510717-7c2d-4e57-ba4b-aaf2916a3e56/oferta` antes de convertir la cuenta. Después de la conversión escribí un precio y pulsé «Enviar la oferta»; volvió a `http://localhost:3100/chat/e6510717-7c2d-4e57-ba4b-aaf2916a3e56`, mostró el aviso y no apareció ninguna oferta nueva. Abrir de nuevo la URL del panel también devolvió al chat. La cuenta pudo seguir escribiendo en la conversación; el mensaje «Sigo escribiendo.» quedó visible.
- **Pestaña vieja de ficha — 390 y 1280 px:** con una ficha sin conversación previa abierta en `http://localhost:3100/producto/c8e5e3cb-789f-4e59-b184-7d66b427fe96`, al pulsar «Agregar al carrito» volvió a la misma ficha, que se dibujó con el aviso nuevo y sin «Comprar con pago protegido», «Agregar al carrito» ni «Escribirle al vendedor». Al pulsar «Escribirle al vendedor» en otra pestaña vieja también volvió a la ficha con el aviso y sin botones de compra. No se creó carrito ni conversación.
- **Pestaña vieja de checkout directo — 390 y 1280 px:** con `http://localhost:3100/comprar/c8e5e3cb-789f-4e59-b184-7d66b427fe96` abierto y los datos de entrega completos, «Ir a pagar» volvió a `http://localhost:3100/producto/c8e5e3cb-789f-4e59-b184-7d66b427fe96`; la ficha mostró el aviso nuevo y no mostró botones de compra.
- **Pestaña vieja de checkout del carrito — 390 y 1280 px:** con un MacBook en el carrito y `http://localhost:3100/comprar/carrito` abierto antes del cambio, «Ir a pagar» volvió a `http://localhost:3100/carrito`; la pantalla mostró el aviso nuevo y no mostró el artículo ni controles de pago.
- **Aviso y comprensión:** en la ficha, el chat y el carrito apareció exactamente «Esta es una cuenta de empresa: en 2venta las empresas venden, pero no compran. Si quieres comprar algo, hazlo desde una cuenta personal, con otro celular.» Ahora queda claro tanto lo que está prohibido como la alternativa. El tono es directo, cálido y accionable.
- **Persona natural que vende — Camila, 390 px:** desde `http://localhost:3100/producto/f9604b52-1df9-4ffb-89b3-ef8d652ef772` llegó a `http://localhost:3100/dev/pago/e09ac59f-1628-4173-8836-be5d5dc837c8`, pulsó «Simular pago aprobado» y terminó en `http://localhost:3100/pedido/e09ac59f-1628-4173-8836-be5d5dc837c8`. Luego `/actividad` mostró «Compras» y «Atrapasueños para cuarto de bebé».
- **Compradora pura — Laura, 390 y 1280 px:** `/actividad` mostró «Compras» y «Aquí van tus compras», sin sección «Ventas». En el menú móvil se conservaron «Carrito» y «Compras y ventas».
- **Empresa — 390 y 1280 px:** `/actividad` mostró solo «Ventas» y «Aquí van tus ventas». El menú no mostró «Carrito» y mostró «Tus ventas». La ficha fresca y `/carrito` respetaron el aviso nuevo.
- **Sin regresiones de chat:** una conversación anterior se conservó, el envío de mensajes siguió funcionando y no apareció «Hacer una oferta» ni «Pagar …» en el chat de empresa. Las rutas de oferta antiguas y nuevas terminaron en el chat sin crear ofertas.

Capturas principales: [v2-C-oferta-aceptada-antes-empresa.png](capturas/v2-C-oferta-aceptada-antes-empresa.png), [v2-C4-390-old-panel-submit.png](capturas/v2-C4-390-old-panel-submit.png), [v2-C4-1280-old-panel-submit.png](capturas/v2-C4-1280-old-panel-submit.png), [v2-C4-390-add.png](capturas/v2-C4-390-add.png), [v2-C4-1280-add.png](capturas/v2-C4-1280-add.png), [v2-C4-390-buy-old.png](capturas/v2-C4-390-buy-old.png), [v2-C4-1280-buy-old.png](capturas/v2-C4-1280-buy-old.png), [v2-C4-390-cart-buy-old.png](capturas/v2-C4-390-cart-buy-old.png), [v2-C4-1280-cart-buy-old.png](capturas/v2-C4-1280-cart-buy-old.png), [v2-C4-390-menu.png](capturas/v2-C4-390-menu.png) y [v2-C4-1280-menu.png](capturas/v2-C4-1280-menu.png).

## Observaciones fuera de alcance

- No evalué las funciones públicas de «Preguntas» ni «Reportar esta publicación».

## NO VERIFICADO

- No repetí publicación propia, ventas ni chats de vendedor de una empresa; ese recorrido no formó parte de la vuelta rápida solicitada.
- No probé el rechazo simulado del KYC.
