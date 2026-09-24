# Informe de segunda vuelta — fila 18 de Catalina

## Veredicto

**PASA CON OBSERVACIONES** — la corrección evita que el atrás del navegador reabra el pedido recién abandonado; los recorridos de búsqueda, chat y pestaña nueva pasan. Queda una observación baja: al mezclar el atrás del navegador con el flujo de pago, reaparece `/comprar/...`, una pantalla de paso.

## Hallazgos

1. **Severidad: baja — el atrás del navegador puede volver al checkout después del flujo de pago**

   **Ancho:** 390 px y 1280 px.

   **Pasos exactos:**

   1. Iniciar sesión como `laura@2venta.demo`.
   2. Abrir «Guante de béisbol juvenil, cuero» y pulsar «Comprar con pago protegido».
   3. En `/comprar/614fe2ed-bd2f-46d9-ad7e-fcc8801ad0e8`, completar «Quién recibe», «Celular de quien recibe», «Dirección» y «Zona», y pulsar «Ir a pagar».
   4. En `/dev/pago/df02f824-e1de-43a9-9fac-149d4417f008` (390 px; en 1280 px se reprodujo con `/dev/pago/7e41690f-8eb3-4c19-8054-ec9cafe075c5`), volver al formulario, «Volver al artículo», «Ir a tu pedido» y «Cancelar este pedido».
   5. Desde el pedido cancelado, pulsar «Volver».
   6. En la ficha del artículo, pulsar el atrás del navegador.

   **Esperado:** el pedido cancelado → «Volver» debe llevar a la ficha; al mezclar el atrás/adelante no debería terminar en una pantalla de paso de compra o pago, ni en un bucle.

   **Visto:** «Volver» sí lleva a `http://localhost:3100/producto/614fe2ed-bd2f-46d9-ad7e-fcc8801ad0e8`. Después, el atrás del navegador lleva a `http://localhost:3100/comprar/614fe2ed-bd2f-46d9-ad7e-fcc8801ad0e8`, donde se ve el texto exacto «Volver al artículo», «¿A dónde lo llevamos?» e «Ir a pagar». El adelante devuelve a la ficha. No aparece `/dev/pago/`, no se bloquea y no entra en un bucle, pero el usuario vuelve a un formulario de paso que ya había atravesado.

   **Capturas:** [390 px, pago](capturas/v2-18-pago-390.png) · [390 px, pedido cancelado](capturas/v2-19-pago-pedido-cancelado-390.png) · [390 px, atrás en checkout](capturas/v2-21-pago-atras-390.png) · [1280 px, atrás estable en checkout](capturas/v2-28-pago-atras-1280-estable-1.png).

## Lo que verifiqué y pasa

- Repetí el hallazgo original con el pedido `7906bfe7-1a39-4838-9cd0-05826d7ed64b`: como Camila, pedido cancelado → «Volver» llevó a `http://localhost:3100/actividad` en 390 y 1280 px. Después, el atrás del navegador llevó a `http://localhost:3100/`, no volvió a abrir el pedido. Vi «Cancelado», «Pedido cancelado» y «No se cobró nada y el artículo volvió al catálogo.» [390 px](capturas/v2-04-390-atras-390.png) · [1280 px](capturas/v2-05-1280-atras-1280.png).
- En búsqueda, cambié tres veces los filtros desde la interfaz: `q=Guante` → categoría «Niños» → zona «Chapinero» → orden «Mayor precio». La ficha fue `http://localhost:3100/producto/614fe2ed-bd2f-46d9-ad7e-fcc8801ad0e8`. «Volver» conservó el filtro final: en 390 px `http://localhost:3100/buscar?q=Guante&categoria=ninos&zona=Chapinero&orden=precio_desc`; en 1280 px la URL incluyó además los campos vacíos del formulario (`min=`, `max=` y `orden=recientes` durante los pasos). [390 px](capturas/v2-07-busqueda-filtros-390.png) · [1280 px](capturas/v2-12-busqueda-filtros-1280.png).
- Mezclando búsqueda con atrás/adelante: desde la búsqueda final, atrás llevó a la URL anterior sin `orden=precio_desc`, adelante restauró la URL final y un segundo «Volver» llevó a `http://localhost:3100/`, el padre coherente de búsqueda. No apareció login, pago ni un bucle. [390 px](capturas/v2-10-busqueda-forward-390.png) · [1280 px](capturas/v2-14-busqueda-forward-1280.png) · [390 px, segundo Volver](capturas/v2-11-busqueda-segundo-volver-390.png).
- En Conversaciones, `http://localhost:3100/chats` → `http://localhost:3100/chat/cf3a1a09-6724-4767-9f7d-6bd839d650ba` → ficha `http://localhost:3100/producto/33d0eebd-253d-44e1-ac73-6895e2fa0631` → «Volver» regresó al chat. Atrás llevó a `/chats` y adelante volvió al chat, en 390 y 1280 px. [390 px](capturas/v2-16-390-chat-forward-390.png) · [1280 px](capturas/v2-17-1280-chat-forward-1280.png).
- El flujo de pago sí produjo pedidos cancelados por la interfaz: `df02f824-e1de-43a9-9fac-149d4417f008` en 390 px y `7e41690f-8eb3-4c19-8054-ec9cafe075c5` en 1280 px. En ambos, el pedido mostró «Cancelado», «Pedido cancelado» y «No se cobró nada y el artículo volvió al catálogo.» [390 px](capturas/v2-19-pago-pedido-cancelado-390.png) · [1280 px](capturas/v2-24-pago-pedido-cancelado-1280.png).
- En una pestaña nueva abierta directamente en `http://localhost:3100/pedido/7906bfe7-1a39-4838-9cd0-05826d7ed64b`, sin recorrido previo, «Volver» llevó a `http://localhost:3100/actividad`. Atrás volvió al pedido y adelante volvió a actividad, sin login, pago ni portada. Pasó en 390 y 1280 px. [390 px](capturas/v2-29-390-pestana-volver-390.png) · [1280 px](capturas/v2-30-1280-pestana-volver-1280.png).

## Observaciones fuera de alcance

- En escritorio, aplicar filtros dejó en la URL parámetros vacíos como `min=`, `max=` y `orden=recientes`; no se evaluó como defecto de la fila 18.
- La pantalla `/dev/pago` mostró «Simular pago aprobado» y «Simular pago rechazado»; no se evaluaron esos resultados porque la prueba requería cancelar el pedido.

## NO VERIFICADO

- Ninguno de los escenarios solicitados quedó sin ejecutar. No probé los resultados de pago aprobado/rechazado porque no eran necesarios para crear el pedido cancelado.
