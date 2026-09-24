# Informe independiente — segunda vuelta de correcciones 19 a 23

## Veredicto

**PASA CON OBSERVACIONES** — la oferta ya aparece en la línea de tiempo administrativa y el orden antes/después del reporte se entiende; queda una observación menor de visibilidad y puntuación en 390 px.

## Hallazgos

### 1. [baja] El marcador del reporte se tapa parcialmente en 390 px y tiene doble punto

- **Ancho:** 390 px principalmente; el doble punto también se ve en 1280 px.
- **Pasos exactos:**
  1. Iniciar sesión como `admin@2venta.demo`.
  2. Abrir `http://localhost:3100/admin/conversaciones/b63775eb-5199-49a4-9c73-d34c179fcd97`.
  3. Ver la pantalla en 390 × 844 sin desplazarla.
- **Esperado:** el marcador del reporte debe quedar completamente visible y leerse como `hora. Desde aquí...`.
- **Visto:** el texto exacto fue `Laura T. reportó la conversación (Intento de estafa) · 24 de sept, 6:02 p. m.. Desde aquí no le llega lo que mande la otra persona.` La barra fija inferior con `Inicio`, `Buscar`, `Chats` y `Perfil` se superpone al marcador en el primer viewport. Medición observada: marcador `top 810.5–874.5`; barra fija `top 782.5–844`, con unos 33 px de solapamiento.
- **Impacto:** la secuencia se entiende después de desplazar, pero al llegar a la pantalla el texto que explica el corte antes/después queda parcialmente cubierto.
- **Capturas:** [1280 px](<./capturas/v2-admin-timeline-check-1280.png>) · [390 px](<./capturas/v2-admin-timeline-check-390.png>)

## Lo que verifiqué y pasa

- **Vista admin corregida, 1280 y 390 px:** en `http://localhost:3100/admin/conversaciones/b63775eb-5199-49a4-9c73-d34c179fcd97` apareció una sola línea de tiempo, en este orden:
  - `Mensaje del comprador antes del reporte`.
  - `Mensaje antes del reporte`.
  - `Foto antes del reporte`.
  - `Oferta de $ 100.000 · rechazada`.
  - `Laura T. reportó la conversación (Intento de estafa) · 24 de sept, 6:02 p. m.. Desde aquí no le llega lo que mande la otra persona.`
  - `Mensaje después del reporte`.
  - `Foto después del reporte`.
  - `Oferta de $ 80.000 · esperando respuesta`.
  Las fotos se ven dentro de sus respectivos eventos y cada evento muestra quién y la hora. La historia antes/después sí se entiende, especialmente en 1280 px. [1280](<./capturas/v2-admin-timeline-1280.png>) · [390](<./capturas/v2-admin-timeline-390.png>).
- **Oferta aceptada:** en otra conversación reportada, `http://localhost:3100/admin/conversaciones/6a6ebe5d-fd30-48f5-b7e4-825532d00e65`, apareció exactamente `Oferta de $ 1.500.000 · aceptada`. [Captura](<./capturas/v2-admin-oferta-aceptada-1280.png>).
- **En vivo, 390/1280 px:** en `http://localhost:3100/chat/b63775eb-5199-49a4-9c73-d34c179fcd97`, `Mensaje del comprador antes del reporte` y `Mensaje antes del reporte` aparecieron en las dos puntas sin recargar. Las acciones de envío respondieron en 826 ms y 322 ms, respectivamente. [Capturas](<./capturas/v2-live-comprador-390.png>) · [vendedor](<./capturas/v2-live-vendedor-1280.png>).
- **Bloqueo silencioso, 390/1280 px:** después del reporte, Camila siguió viendo `Mensaje después del reporte`, `Foto después del reporte` y `Oferta de $ 80.000 · esperando respuesta`; no apareció ningún indicador de reporte para ella. Laura conservó la actividad anterior —incluida `Foto antes del reporte` y `Oferta de $ 100.000 · rechazada`—, pero no vio los mensajes, foto ni oferta posteriores, en vivo ni después de recargar. [Antes](<./capturas/v2-antes-reporte-1280.png>) · [después vendedor](<./capturas/v2-despues-reporte-vendedor-1280.png>) · [chat comprador](<./capturas/v2-bloqueo-chat-390.png>).
- **Bandeja y avisos:** en `http://localhost:3100/chats`, la conversación de `Gafas de sol estilo aviador, marco dorado` conservó como último texto `Foto antes del reporte`; no mostró `Mensaje después del reporte` ni `Foto después del reporte`, y no apareció contador sin leer. En `http://localhost:3100/avisos` permaneció el aviso previo `Mensaje nuevo sobre Gafas de sol estilo aviador, marco dorado`, sin aviso nuevo por la actividad posterior. [Chats](<./capturas/v2-bloqueo-chats-390.png>) · [Avisos](<./capturas/v2-bloqueo-avisos-390.png>).
- **Cola, 1280 px:** en `http://localhost:3100/admin/conversaciones`, las entradas nuevas mostraron exactamente `URGENTE`, `INTENTO DE ESTAFA`, `2 personas distintas reportaron a Camila V.` para Gafas, y `URGENTE`, `INSULTOS O AMENAZAS`, `2 personas distintas reportaron a Camila V.` para Tacones. [Captura](<./capturas/v2-cola-check-1280.png>).

## Observaciones fuera de alcance

- **21:** el vendedor siguió siendo el único que pudo adjuntar fotos; las fotos anteriores y posteriores se mostraron correctamente al equipo. No lo reporto como defecto.
- La cola conservaba reportes de ejecuciones anteriores; comparé las entradas nuevas de Gafas y Tacones, que sí mostraron las marcas y el contador esperados.

## NO VERIFICADO

- No esperé 24 horas para generar una oferta `vencida`; en esta vuelta verifiqué `rechazada`, `esperando respuesta` y `aceptada`.
- No forcé una caída real de red, despliegue o cierre del proceso SSE.
- No repetí de forma independiente los textos de vacío de la fila 19 ni «Volver» de la fila 23 en esta segunda vuelta; ambos habían pasado en la primera.
