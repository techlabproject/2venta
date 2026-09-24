# Informe de segunda vuelta — fila 7, celular colombiano

**Veredicto: `PASA` — la observación original quedó corregida y no encontré una regresión reproducible en 390 ni 1280 px.**

## Hallazgos

Ninguno.

## Lo que verificaste y pasa

- **Backspace después del primer espacio — 390 y 1280 px.**
  - URL exacta: `http://localhost:3100/registro`.
  - Pasos: escribir `3004128805`, dejar el cursor justo después de `300 ` y pulsar `Backspace`.
  - Resultado visto: `304 128 805`; se borró el dígito anterior (`0`), el cursor quedó en la posición 2 y el formato siguió agrupado.
  - Capturas: [390 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-backspace-primer-espacio-390.png>) y [1280 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-backspace-primer-espacio-1280.png>).

- **Backspace después del segundo espacio — 390 y 1280 px.**
  - URL exacta: `http://localhost:3100/registro`.
  - Pasos: escribir `3004128805`, dejar el cursor justo después de `300 412 ` y pulsar `Backspace`.
  - Resultado visto: `300 418 805`; se borró el dígito anterior (`2`), el cursor quedó en la posición 6 y no hubo salto al final.
  - Capturas: [390 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-backspace-segundo-espacio-390.png>) y [1280 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-backspace-segundo-espacio-1280.png>).

- **Supr delante de un espacio — 390 y 1280 px.**
  - URL exacta: `http://localhost:3100/registro`.
  - Pasos: escribir `3004128805`, colocar el cursor delante del primer espacio y pulsar `Supr`; repetir delante del segundo espacio.
  - Resultado visto en ambos casos: el valor conserva `300 412 8805`, no se borra ningún dígito y el cursor permanece en la posición 3 o 7. El separador es de formato y no deja la cadena corrupta.
  - Capturas: [Supr primer espacio, 390 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-delete-antes-primer-espacio-390.png>) y [Supr segundo espacio, 1280 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-delete-antes-segundo-espacio-1280.png>).

- **Borrado continuo — 390 y 1280 px.**
  - URL exacta: `http://localhost:3100/registro`.
  - Pasos: escribir `3004128805`, mantener `Backspace` y después repetir seis pulsaciones consecutivas para comprobar varias eliminaciones.
  - Resultado visto: la pulsación sostenida dejó `300 412 880`; seis eliminaciones consecutivas dejaron `300 4`. El agrupamiento se mantuvo y no hubo cursor errático ni separadores sobrantes.
  - Capturas: [sostenido, 390 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-backspace-mantenido-390.png>) y [seis pulsaciones, 1280 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-backspace-seis-1280.png>).

- **Selección de tramo con espacios — 390 y 1280 px.**
  - URL exacta: `http://localhost:3100/registro`.
  - Pasos: escribir `3004128805`, seleccionar el tramo que visualmente corresponde a `0 412 8` y pulsar `Supr`.
  - Resultado visto: `308 05`, con la selección colapsada en la posición 2; los dígitos restantes se juntaron y se reagruparon sin caracteres extraños.
  - Capturas: [390 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-seleccion-tramo-delete-390.png>) y [1280 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-seleccion-tramo-delete-1280.png>).

- **Repaso de pegado — 390 y 1280 px.**
  - URL exacta: `http://localhost:3100/registro`.
  - Pasos: pegar `+57 300 412 8805`.
  - Resultado visto: el campo queda exactamente `300 412 8805`, sin error y con el foco en `phone`.
  - Capturas: [390 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-pegado-plus57-390.png>) y [1280 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-pegado-plus57-1280.png>).

- **Repaso de mensajes al salir — 390 y 1280 px.**
  - URL exacta: `http://localhost:3100/registro`.
  - `30041288` al salir muestra exactamente `Te faltan 2 dígitos: son 10 en total.` y marca `aria-invalid="true"`.
  - `2004128805` muestra exactamente `¡Uy! Los celulares en Colombia empiezan por 3.`.
  - Corregir a `3004128805` deja `300 412 8805`, quita el error y elimina `aria-invalid`.
  - Capturas: [incompleto, 390 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-mensaje-incompleto-390.png>) y [prefijo, 1280 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-mensaje-prefijo-1280.png>).

- **Registro real con celular válido — 390 px.**
  - URL inicial: `http://localhost:3100/registro?rol=comprador`.
  - Celular escrito: `322 029 3370`; valor visible agrupado antes de enviar: `322 029 3370`.
  - El formulario llegó a `http://localhost:3100/verificar?rol=comprador`; el código obtenido con `codigo-sms.sh` fue `934827`, se aceptó y terminó en `http://localhost:3100/` con el usuario `LV`.
  - Capturas: [antes de enviar](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-registro-real-preenvio-390.png>), [código](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-registro-real-codigo-390.png>) y [sesión iniciada](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/v2-registro-real-entra-390.png>).

## Observaciones fuera de alcance

- Ninguna nueva observada en esta segunda vuelta.

## NO VERIFICADO

- No repetí el flujo de Google ni la vista del celular desde el pedido del vendedor; ambos quedaron fuera de esta segunda vuelta corta.
