# Informe de prueba — fila 18 de Catalina

## Veredicto

**PASA CON OBSERVACIONES** — «Volver» conserva el recorrido correcto en 390 y 1280 px, incluido el pedido cancelado; queda una observación baja cuando se mezcla con el atrás del navegador.

## Hallazgos

1. **Severidad: baja — historial del navegador mezclado con «Volver»**

   **Ancho:** 390 px y 1280 px.

   **Pasos exactos:**

   1. Iniciar sesión como `laura@2venta.demo`.
   2. Abrir `http://localhost:3100/actividad`.
   3. Abrir la fila «Guante de béisbol juvenil, cuero — $ 82.000 — Cancelado · compraste a Camila V. · 24 de sept».
   4. En `http://localhost:3100/pedido/80b1345b-010f-4cd4-a23e-cd4eab503ec0`, pulsar el botón «Volver».
   5. Desde `http://localhost:3100/actividad`, abrir otra vez el mismo pedido, pulsar «Volver» y después el botón atrás del navegador.

   **Esperado:** no caer en la portada, no quedar bloqueada ni entrar en un bucle entre actividad y pedido.

   **Visto:** «Volver» sí lleva a `http://localhost:3100/actividad`. Al pulsar después el atrás del navegador, reaparece `http://localhost:3100/pedido/80b1345b-010f-4cd4-a23e-cd4eab503ec0`, con el texto exacto «Cancelado», «Pedido cancelado» y «No se cobró nada y el artículo volvió al catálogo.» Un segundo «Volver» devuelve a `http://localhost:3100/actividad`. Funcionalmente no se bloquea ni llega a `/`, pero la reaparición del pedido puede confundir porque es una entrada anterior del historial del navegador.

   **Capturas:** [390 px, mezcla atrás/Volver](capturas/37-laura-mezcla-atras-volver-390.png) · [1280 px, mezcla atrás/Volver](capturas/44-laura-mezcla-atras-volver-1280.png).

## Lo que verifiqué y pasa

- Creé por la interfaz un pedido de «Guante de béisbol juvenil, cuero» de Camila, llegué a `http://localhost:3100/dev/pago/80b1345b-010f-4cd4-a23e-cd4eab503ec0`, lo dejé pendiente y pulsé «Cancelar este pedido». Vi «Cancelado», «Pedido cancelado» y «No se cobró nada y el artículo volvió al catálogo.» [Pedido cancelado, 390 px](capturas/14-pedido-cancelado-390.png).
- Como vendedora Camila: `http://localhost:3100/actividad` → pedido cancelado → «Volver» regresó exactamente a `http://localhost:3100/actividad`, manteniendo «Ventas» y la fila «Cancelado · vendiste a Laura T. · 24 de sept». Pasó en 390 y 1280 px. [390 px](capturas/16-camila-pedido-cancelado-390.png) · [1280 px](capturas/38-camila-pedido-cancelado-1280.png).
- Como compradora Laura: `http://localhost:3100/actividad` → pedido cancelado → «Volver» regresó exactamente a `http://localhost:3100/actividad`, manteniendo «Compras» y la fila «Cancelado · compraste a Camila V. · 24 de sept». Pasó en 390 y 1280 px. [390 px](capturas/30-laura-pedido-cancelado-390.png) · [1280 px](capturas/46-laura-pedido-cancelado-1280.png).
- Como vendedora, `http://localhost:3100/chats` → conversación «Control DualShock 4 original, negro» (`http://localhost:3100/chat/cf3a1a09-6724-4767-9f7d-6bd839d650ba`) → tarjeta del artículo (`http://localhost:3100/producto/33d0eebd-253d-44e1-ac73-6895e2fa0631`) → «Volver» regresó al chat → segundo «Volver» regresó a `http://localhost:3100/chats`. Pasó en ambos anchos. [390 px](capturas/20-camila-chat-390.png) · [390 px, regreso](capturas/23-camila-chats-back-390.png) · [1280 px](capturas/41-camila-chats-back-1280.png).
- Como vendedora, «Tus publicaciones» (`http://localhost:3100/vender/metricas`) → «Guante de béisbol juvenil, cuero» → ficha del artículo → «Volver» regresó a `http://localhost:3100/vender/metricas`, no a la portada. Pasó en ambos anchos. [390 px](capturas/28-camila-publicaciones-back-390.png) · [1280 px](capturas/42-camila-publicaciones-back-1280.png).
- Recargar el pedido conservó el retorno a `/actividad`; abrir directamente el pedido en una pestaña nueva, sin recorrido, usó el padre `/actividad`. [Recarga 390 px](capturas/32-laura-pedido-recargado-390.png) · [Pestaña nueva 390 px](capturas/35-laura-pestana-nueva-volver-390.png) · [Pestaña nueva 1280 px](capturas/43-laura-pestana-nueva-volver-1280.png).
- Tres ciclos seguidos produjeron exactamente `pedido → actividad → pedido → actividad → pedido → actividad` en 390 y 1280 px; no terminaron en `/` ni quedaron en un bucle sin salida. [390 px](capturas/36-laura-repeticiones-390.png).

## Observaciones fuera de alcance

- La sesión de Camila mostraba además un pedido pagado a «Andrés M.» y un chat previo con «Luna V.» sobre «Control DualShock 4 original, negro»; se usaron solo como datos disponibles para recorrer Conversaciones, no se evaluaron otras filas.
- En `/dev/pago` se vieron «Simular pago aprobado» y «Simular pago rechazado»; no se evaluó el comportamiento de esos dos resultados porque el pedido cancelado se obtuvo desde «Cancelar este pedido».

## NO VERIFICADO

- No repetí el rol de vendedora con `andres@2venta.demo`; Camila cubrió el mismo recorrido de vendedor solicitado.
- No probé un pedido pagado, porque sí fue posible crear y cancelar el pedido pendiente requerido.
