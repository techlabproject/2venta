# La cámara al publicar y los datos personales

Corrección 36 de Catalina (2026-09-24): «Para el tema de prender la cámara, ¿hay
protección de datos o algo a nivel de seguridad que debamos tener? Averiguar y
documentar». Decisiones de Nicolás marcadas como tales.

## Qué pasa cuando alguien graba el video

1. **La cámara solo se enciende cuando la persona toca «Abrir cámara».** El
   navegador pide permiso la primera vez («2venta quiere usar tu cámara»); si lo
   niega, no se graba nada y la pantalla lo dice.
2. **Se usa la cámara trasera** (`facingMode: environment`): la que apunta al
   artículo, no a la persona.
3. **Sin micrófono** (decisión de Nicolás): se graba solo imagen. El video es
   público, y lo que se hable alrededor —una conversación de la casa, la voz de un
   niño— no tiene por qué quedar publicado. La conversión de video en la nube
   (MediaConvert) tampoco produce sonido aunque el original lo traiga.
4. **Máximo 30 segundos.** La cámara se apaga al terminar de grabar y al salir de la
   pantalla (se cierran las pistas del `MediaStream`): no queda encendida en segundo
   plano.
5. **No se sube desde la galería** (D-14): se graba en ese momento para probar que el
   artículo existe hoy y lo tiene esa persona.
6. **Antes de grabar**, la tarjeta «Antes de grabar» le dice qué mostrar y, desde
   esta corrección, **«Que no salgan caras, documentos ni la dirección de tu casa: el
   video lo ve todo el mundo»** (decisión de Nicolás).

## Dónde queda y quién lo ve

- El navegador sube el video **directo al bucket** con una dirección firmada que
  vence en minutos (D-50); el servidor comprueba después que sea un video suyo.
- El bucket **no es público**: solo CloudFront lo lee (política del bucket en
  `infra/modules/entorno/archivos.tf`). Pero el video de una publicación **sí es
  público**: cualquiera con el enlace lo ve, y el catálogo y la ficha lo muestran.
  Las direcciones llevan un identificador aleatorio: no se pueden recorrer.
- Retirar una publicación no borra el video: es la evidencia de cómo estaba el
  artículo si hay un reclamo (D-13).

## Qué dice la ley (Colombia)

- **Ley 1581 de 2012 y Decreto 1377 de 2013:** la imagen y la voz de una persona
  identificable son datos personales. Publicarlas necesita autorización de esa
  persona. Quien graba es quien decide qué sale en su video; 2venta pide en los
  términos y en la tarjeta que no salgan otras personas, y retira lo que se reporte.
- **Niños (art. 7 de la Ley 1581):** los datos de menores tienen protección
  reforzada. En la categoría «Artículos para niños» es más probable que salga un
  niño: por eso el consejo va en la tarjeta y no solo en los términos.
- **Datos sensibles (art. 5):** la biometría. El video del artículo **no** se usa
  para reconocer a nadie; la única biometría es la selfie de la verificación de
  identidad, con su autorización aparte (D-108).
- **Permiso del navegador:** no reemplaza la autorización de la ley; es la
  protección técnica de que la cámara no se prenda sin que la persona lo pida.

## Lo que falta o queda por decidir

- **Revisar los videos que muestran personas o datos**: hoy nada lo detecta; depende
  de los reportes. Una revisión automática (detección de caras, de texto en imagen)
  tiene costo por video.
- **Borrar o pixelar a pedido** de alguien que sale en un video ajeno: hoy solo se
  puede retirar la publicación entera (desde `/admin`).
- **Plazo de conservación** de los videos de publicaciones vendidas o retiradas: no
  está fijado (fila 11, política de datos).
- Los videos grabados **antes** de esta corrección conservan su sonido.
