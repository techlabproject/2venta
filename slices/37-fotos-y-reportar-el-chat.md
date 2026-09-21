# S-37 — Fotos en el chat, y una salida cuando se pone feo

## Qué hace

Dos cosas que pidió Nicolás en el mismo mensaje que la S-36:

1. **El vendedor puede mandar fotos** en la conversación. El disparador fue literal:
   en su captura, el comprador escribe «puedo ver mas fotos» y no había forma de
   contestar con una.
2. **El comprador puede reportar la conversación** cuando se vuelve inapropiada.

## Por qué van juntas

Porque la segunda es la condición de la primera. Abrir un canal por el que entran
imágenes a una conversación privada, entre desconocidos, sin ninguna salida para
quien recibe algo que no pidió, sería añadir una superficie de abuso y ninguna
defensa. El filtro de contenido (D-19) lee texto; una imagen se lo salta entera.

## Alcance

1. **Migración `0013`**: `messages.image_path` y tabla `chat_reports`.
2. **Subida directa al bucket con URL prefirmada** (D-50), igual que el video y las
   fotos de la publicación: la acción de servidor recibe la clave y la comprueba con
   `claim()` contra S3. Nunca se confía en el tipo ni en el tamaño que declara el
   cliente.
3. **Solo el vendedor de ese artículo puede adjuntar.** Es lo que se pidió, y es el
   lado que tiene algo que enseñar. Queda anotado que el comprador también lo
   necesitará el día que haya un reclamo con fotos del defecto.
4. **Reportar la conversación**, disponible para las dos partes, con motivo y detalle.
   Entra a la cola de moderación.
5. **La foto reportada no se borra.** Si alguien reporta, la evidencia tiene que
   seguir ahí para quien modere.

## Qué queda explícitamente fuera

- **Bloquear a una persona.** Es otra cosa distinta de reportar y necesita decidir qué
  pasa con los pedidos en curso entre las dos.
- **Moderación automática de imágenes.** Necesita un proveedor.
- **Varias fotos por mensaje.** Una por mensaje, que es lo que resuelve el caso.
- **Que el comprador adjunte.** Ver punto 3.

## Zona sensible

IMPORTANT: datos personales y contenido entre dos personas.

- La clave de la imagen se comprueba con `claim()` contra el bucket antes de
  guardarla; el cliente no decide qué se guarda.
- Solo las dos partes ven la imagen: la dirección se arma con `mediaUrl()` en el
  servidor, igual que el resto.
- Reportar **no** revela nada a la otra parte: no se le avisa. Que el reporte fuera
  visible convertiría el botón en algo que da miedo usar, que es lo contrario de lo
  que hace falta.
- Una persona reporta una conversación una vez (índice único), para que nadie infle
  la cola de moderación.

## Prueba de punta a punta

`e2e/chat-fotos.spec.ts`:

1. El vendedor manda una foto y las dos partes la ven en la conversación.
2. El comprador no tiene el control de adjuntar.
3. Una clave que no se subió al bucket se rechaza.
4. Una clave de otra persona no se puede adjuntar.
5. El comprador reporta la conversación y entra a la cola de moderación.
6. Reportar dos veces no duplica el reporte.
7. Quien no es parte de la conversación no puede reportarla.
