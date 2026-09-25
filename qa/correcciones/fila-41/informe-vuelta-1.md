# Informe de prueba — corrección 41

**Veredicto: NO PASA — al retirar un artículo guardado, desaparece de Guardados y no llega a «Ya no están».**

## Hallazgos

1. **Severidad: media — un guardado retirado desaparece sin explicación.**

   **Ancho:** 1280 px para retirar; 390 px para comprobarlo como Laura.

   **Pasos:** Camila retiró «Guante de béisbol juvenil, cuero» desde `/vender/metricas`. Luego Laura abrió `http://localhost:3100/favoritos`.

   **Esperado:** el artículo debía pasar a «Ya no están», con «Se vendieron o los retiraron.».

   **Visto:** Laura solo ve «Triciclo rojo para niños de 2 a 4 años» y:

   «Lo que marcaste con ♡. Si algo se vende, pasa a «Ya no están».»

   No aparecen «Ya no están», «Se vendieron o los retiraron.» ni el artículo retirado.

   **Capturas:** [diálogo](capturas/11-dialogo-retirar-guante-1280.png), [retiro confirmado](capturas/12-camila-retirado-1280.png), [resultado en Guardados](capturas/13-laura-tras-retiro-390.png).

## Lo que verifiqué y pasa

- Cuenta nueva, 390 px: «Todavía no has guardado nada» y el texto nuevo completo. [Captura](capturas/04-guardados-vacio-cuenta-nueva-390.png)
- Laura vacía, 1280 px; no apareció el texto antiguo. [Captura](capturas/05-guardados-vacio-laura-1280.png)
- Dos artículos guardados visibles en 390 y 1280 px. [390](capturas/07-guardados-con-dos-390.png) · [1280](capturas/10-guardados-con-dos-1280.png)
- Avisos vacío muestra el texto elegido y enlaza a Guardados. [Captura](capturas/08-avisos-vacio-1280-correcto.png)
- Los enlaces «Avisos», «Guardados» y «Volver» llevan a las URLs esperadas.
- Aviso real visible en 390 y 1280 px: «Mensaje nuevo sobre Triciclo rojo para niños de 2 a 4 años». [390](capturas/16-laura-avisos-con-notificacion-390.png) · [1280](capturas/17-laura-avisos-con-notificacion-1280.png)
- Las búsquedas guardadas aparecen en Avisos y enlazan correctamente a `/buscar?q=iPhone`. [Captura](capturas/18-avisos-con-busqueda-guardada-1280.png)
- No observé desbordamiento horizontal en 390 px.

## Observaciones fuera de alcance

- Registro, aceptación de términos y verificación por SMS funcionaron.
- El retiro de Camila confirmó la acción y dejó el artículo en «Retiradas».
- El aviso usado provino de un mensaje de chat y mostró «Marcar todo como visto».

## NO VERIFICADO

- No ejecuté una venta completa para probar la rama `vendida`.
- No verifiqué avisos generados automáticamente por publicar un artículo que coincida con una búsqueda guardada.