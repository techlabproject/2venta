# Informe de prueba — corrección 41, vuelta 2

**Veredicto: PASA — el retirado queda en «Ya no están» sin enlace roto, y al republicarlo vuelve a Guardados arriba; los estados y enlaces de la vuelta 1 siguen funcionando.**

## Hallazgos

No se encontraron hallazgos reproducibles en esta vuelta.

## Lo que verifiqué y pasa

1. **Retirado visible y sin enlace.**

   **Ancho:** 390 y 1280 px.

   Laura guardó «Gafas de sol estilo aviador, marco dorado». Camila lo retiró desde `http://localhost:3100/vender/metricas`. Laura volvió a abrir `http://localhost:3100/favoritos`.

   Aparecen «Ya no están», «Se vendieron o los retiraron.» y la tarjeta del artículo. El contenedor de la tarjeta tuvo 0 enlaces.

   **Capturas:** [390](capturas/v2-05-laura-gafas-retirada-390.png) · [1280](capturas/v2-05-laura-gafas-retirada-1280.png)

2. **Republicar devuelve el artículo a Guardados activos.**

   **Ancho:** 1280 px para republicar; 390 y 1280 px para Laura.

   Camila pulsó «Republicar» en «Retiradas». Laura volvió a `/favoritos`.

   «Gafas de sol estilo aviador, marco dorado» aparece arriba, ya no está en «Ya no están» y su enlace abre correctamente:

   `http://localhost:3100/producto/25e373c8-1ff2-4072-aff6-ddc56c06345e`

   **Capturas:** [Camila](capturas/v2-06-camila-gafas-republicada-1280.png), [Laura 390](capturas/v2-07-laura-gafas-republicada-390.png), [Laura 1280](capturas/v2-07-laura-gafas-republicada-1280.png)

## Repaso rápido de la vuelta 1

- `/favoritos` vacío mantiene «Todavía no has guardado nada» y el texto nuevo en 390 y 1280 px.
- El texto antiguo «El corazón de cada artículo» no apareció.
- `/avisos` vacío mantiene el texto elegido y la sección «Búsquedas guardadas».
- «Avisos», «Guardados» y «Volver» llevan a las URLs esperadas.
- El aviso «Mensaje nuevo sobre Triciclo rojo para niños de 2 a 4 años» sigue visible en ambos anchos.
- Guardar una búsqueda sigue mostrando «Guardada. Te avisamos cuando aparezca algo que coincida.» y aparece en Avisos.

## Observaciones fuera de alcance

- Laura conservaba datos de la vuelta 1; para aislar la prueba se usó otra publicación activa de Camila.
- La publicación retirada quedó en «Retiradas» con la acción «Republicar».

## NO VERIFICADO

- No ejecuté una venta completa para cambiar una publicación a `vendida`.
- No probé un aviso automático generado por una publicación nueva que coincida con una búsqueda guardada.