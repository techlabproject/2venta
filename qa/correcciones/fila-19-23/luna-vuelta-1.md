# Informe independiente — correcciones 19 a 23

## Veredicto

**NO PASA** — la vista administrativa de una conversación reportada omite las ofertas; la conversación no se puede leer completa para moderación.

## Hallazgos

### 1. [media] La conversación reportada no incluye las ofertas en la vista de administración

- **Ancho:** 1280 px en la vista de administración; 1280 px en el chat del vendedor.
- **Pasos exactos:**
  1. Iniciar sesión como `laura@2venta.demo` y abrir `http://localhost:3100/producto/49e1192f-ea60-47f9-ae83-f23715fc4b36`.
  2. Tocar «Escribirle al vendedor». La conversación quedó en `http://localhost:3100/chat/3e2b8f67-924d-4072-8f9e-cc267e0abda4`.
  3. Como `camila@2venta.demo`, enviar `Mensaje anterior al reporte`.
  4. Como Laura, reportar con motivo «Está intentando estafarme».
  5. Como Camila, enviar `Mensaje posterior al reporte`, adjuntar una foto y enviar `Foto posterior al reporte`; después hacer una oferta de `60000`.
  6. Como `admin@2venta.demo`, abrir `http://localhost:3100/admin/conversaciones/3e2b8f67-924d-4072-8f9e-cc267e0abda4`.
- **Esperado:** la conversación completa, incluidos mensajes, foto y oferta, para que el equipo pueda revisar también la negociación.
- **Visto:** en el chat del vendedor apareció exactamente `OFRECISTE`, `$ 60.000`, `Esperando respuesta`. En la URL administrativa solo aparecieron estos textos: `Mensaje anterior al reporte`, `Mensaje posterior al reporte` y `Foto posterior al reporte`; no apareció `$ 60.000`, `OFRECISTE` ni `Esperando respuesta`.
- **Capturas:** [chat del vendedor con oferta y foto](<./capturas/C-vendedor-sigue-sin-notarlo-1280.png>) · [vista administrativa](<./capturas/C-admin-conversacion-completa-1280.png>)

## Lo que verifiqué y pasa

- **19, 390/1280 px:** la compradora vio exactamente `Todavía no se han escrito. Pregúntale lo que necesites saber antes de comprar: en qué estado está, por qué lo vende, si tiene la caja.`; la vendedora vio exactamente `¡Laura T. le echó el ojo a tu artículo! Abrió el chat, pero todavía no ha escrito. Puedes saludar y contarle lo que le ayude a decidirse: cómo está de verdad, si trae caja o accesorios, cómo te queda la entrega.` URL: `http://localhost:3100/chat/9d6d1f98-3f0d-458b-b4dd-b21ab54f0862`. Capturas: [compradora](<./capturas/A-chat-vacio-compradora-390.png>) · [vendedora](<./capturas/A-chat-vacio-vendedora-1280.png>).
- **20, 390/1280 px:** con el mismo chat abierto, `Hola, ¿sigue disponible?` llegó a la vendedora en 318 ms y `Sí, sigue disponible.` llegó a la compradora en 1319 ms, sin recargar. El borrador `Estoy escribiendo sin terminar` no se perdió. La oferta de `$ 2.500.000` llegó sola y se vio `Aceptada`; una segunda oferta de `$ 90.000` se vio `Rechazada`. Capturas: [mensaje y borrador](<./capturas/A-live-received-and-draft-1280.png>) · [oferta recibida](<./capturas/A-oferta-recibida-1280.png>) · [oferta rechazada](<./capturas/A-oferta-rechazada-390.png>).
- **20, filtro, 390 px:** `Mi número es 300 123 4567` se mostró como `Mi número es •••••` y apareció exactamente `Ocultamos ese dato. Si pagas fuera de 2venta pierdes el pago protegido y no podemos ayudarte si algo sale mal.` en las dos puntas. [Captura](<./capturas/A-filtro-telefono-390.png>).
- **20, no leídos, 1280 px:** después de `Mensaje para dejar sin leer`, `http://localhost:3100/chats` mostró exactamente `1 sin leer` y la fila mostró `Mensaje para dejar sin leer`; al abrir el chat el contador desapareció. [Captura](<./capturas/A-chats-sin-leer-1280.png>).
- **20, pausa, 390/1280 px:** en `http://localhost:3100/chat/a95beb97-559c-42a3-b402-04843089f759`, una conversación sin oferta previa, dejé la pestaña del vendedor quieta 120 segundos. Después, `Después de la pausa larga, sigo aquí` apareció en la otra punta y se conservó `Borrador antes de la pausa larga`. [Antes](<./capturas/G2-antes-de-pausa-1280.png>) · [después](<./capturas/G2-despues-de-pausa-1280.png>).
- **B, 390 px:** `http://localhost:3100/api/chat/9d6d1f98-3f0d-458b-b4dd-b21ab54f0862/eventos` devolvió `200` y `text/event-stream; charset=utf-8` para una parte; devolvió `401` sin sesión y `404` para `andres@2venta.demo`, que era ajeno.
- **22, bloqueo, 390/1280 px:** tras reportar, Laura vio exactamente `Reportaste esta conversación. No le avisamos a la otra persona, y ya no te llegan sus mensajes ni sus ofertas; los guardamos para que el equipo los revise.` El vendedor siguió viendo y enviando `Mensaje posterior al reporte`, una foto y una oferta, sin indicador de reporte. Laura no vio esos elementos ni en el chat recargado, ni en `http://localhost:3100/chats`, ni en `http://localhost:3100/avisos`; `/chats` conservó `Mensaje anterior al reporte`. Capturas: [estado reportado](<./capturas/C-reportado-mensaje-exacto-390.png>) · [bloqueo en chat](<./capturas/C-compradora-bloqueo-chat-390.png>) · [bloqueo en chats](<./capturas/C-compradora-bloqueo-chats-390.png>) · [bloqueo en avisos](<./capturas/C-compradora-bloqueo-avisos-390.png>).
- **22, cola, 1280 px:** en `http://localhost:3100/admin/conversaciones`, los dos reportes creados contra Camila mostraron `URGENTE`, `2 personas distintas reportaron a Camila V.` y los motivos `INTENTO DE ESTAFA` / `INSULTOS O AMENAZAS`; el reporte leve contra Andrés mostró `OTRA COSA` y quedó después de los urgentes. [Captura](<./capturas/D-cola-reportes-1280.png>).
- **23, 390 px:** desde `/chats`, «Volver» llevó a `http://localhost:3100/chats`; desde `http://localhost:3100/producto/07ff7bc3-b188-42eb-b3e7-0ba79c91bfb0`, abrió un chat nuevo y «Volver» llevó de regreso a esa ficha. Capturas: [desde chats](<./capturas/F-limpio-volver-desde-chats-390.png>) · [desde ficha](<./capturas/F-limpio-volver-desde-ficha-390.png>).

## Observaciones fuera de alcance

- **21:** el vendedor pudo adjuntar una foto y el comprador no tuvo control de adjuntar; la foto se mostró en el chat del vendedor y en la vista administrativa. No lo reporto como defecto porque la decisión indica evaluarlo después.
- La cola ya contenía reportes de ejecuciones anteriores; para el orden comparé las entradas nuevas de Camila y Andrés, que sí quedaron en el orden esperado.

## NO VERIFICADO

- No forcé un corte real de red, despliegue o cierre del proceso SSE; sí verifiqué que una pestaña quieta 120 segundos siguiera en vivo al volver a ella.
