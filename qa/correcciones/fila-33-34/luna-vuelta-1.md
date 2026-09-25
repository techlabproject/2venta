# Informe independiente — correcciones 33 y 34

Fecha: 2026-09-24. Probé en Chromium real con contextos nuevos por escenario; anchos 390×844 y 1280×800.

## Veredicto

**PASA CON OBSERVACIONES** — la paginación funciona en portada, búsqueda y “Tus publicaciones”, pero guardar una búsqueda desde la página 2 no vuelve a la primera página como se pidió.

## Hallazgos

### 1. Guardar una búsqueda en la página 2 no reinicia la paginación

- **Severidad:** media.
- **Ancho:** 1280 px.
- **Pasos exactos:** iniciar sesión como `camila@2venta.demo`; abrir `http://localhost:3100/buscar?q=LunaPaginacion1790300436266&orden=precio_desc&pagina=2`; hacer clic en `Avísame cuando aparezca algo así`; escribir `Alerta LunaPaginacion1790300436266`; hacer clic en `Guardar`.
- **Esperado:** guardar la búsqueda y volver a la primera página: URL sin `pagina=2`, 24 tarjetas y `Ves 24 de 130 artículos`.
- **Visto:** aparece el texto exacto `Guardada. Te avisamos cuando aparezca algo que coincida.`, pero la URL queda exactamente `http://localhost:3100/buscar?q=LunaPaginacion1790300436266&orden=precio_desc&pagina=2`; siguen visibles 48 tarjetas y `Ves 48 de 130 artículos`. La búsqueda sí queda guardada.
- **Captura:** [guardar en página 2](capturas/b-guardar-busqueda-pagina-2.png)

## Lo que verifiqué y pasa

- **Portada sin filtros:** en 390 y 1280, `http://localhost:3100/` mostró `Ves 24 de 142 artículos` y `Ver más`; en 390, `?pagina=2` mostró 48 tarjetas. Capturas: [390](capturas/a-portada-sin-filtros-390-p1.png), [1280](capturas/a-portada-sin-filtros-1280-p1.png), [página 2](capturas/a-portada-sin-filtros-390-p2.png).
- **Portada filtrada:** `http://localhost:3100/?categoria=ropa` mostró `Ves 24 de 134 artículos` en ambos anchos. Capturas: [390](capturas/a-portada-390.png), [1280](capturas/a-portada-1280.png).
- **Búsqueda:** con 130 resultados, se vieron `Ves 24 de 130 artículos`, luego `Ves 48 de 130 artículos` y `Ves 72 de 130 artículos`; al llegar a `http://localhost:3100/buscar?q=LunaPaginacion1790300436266&pagina=6` hubo 130 tarjetas y no apareció `Ver más`. No hubo títulos repetidos ni faltantes en el acumulado; el scroll quedó en `3427` antes y después de pulsar “Ver más”. Capturas: [página 1](capturas/a-buscar-390-pagina-1.png), [página 2](capturas/a-buscar-390-pagina-2.png), [final](capturas/a-buscar-390-final.png).
- **Escritorio y navegación:** en 1280, `http://localhost:3100/buscar?q=LunaPaginacion1790300436266&pagina=3` mostró 72 tarjetas y `130 resultados`. Atrás volvió a `pagina=5` con 120 tarjetas; adelante volvió a `pagina=6` con 130. Recargar `pagina=3` conservó 72. “Volver” regresó a `http://localhost:3100/`. Captura: [búsqueda escritorio](capturas/a-buscar-1280-pagina-3.png).
- **Filtros y orden:** `orden=precio_desc` paginó a 48 tarjetas en `pagina=2`; cambiar a `zona=Chapinero` quitó `pagina` y volvió a 24. El rango `Menos de $50.000` mostró `40 resultados` y `Ves 24 de 40 artículos`; `pagina=2` mostró 40. Cambiar a `categoria=ninos` quitó `pagina` y mostró `0 resultados`. Capturas: [orden](capturas/b-orden-mayor-pagina-2.png), [cambio de zona](capturas/b-cambio-filtro-vuelve-p1.png), [precio](capturas/b-precio-rango-pagina-2.png), [categoría sin resultados](capturas/b-categoria-vuelve-p1-sin-resultados.png).
- **Direcciones raras:** `pagina=0`, `pagina=-1`, `pagina=abc` y `pagina=1.5` mostraron 24 tarjetas y `Ves 24 de 130 artículos`; `pagina=999` mostró 130 tarjetas sin `Ver más`, sin error 500. URLs conservadas exactamente: `http://localhost:3100/buscar?q=LunaPaginacion1790300436266&pagina=0`, `...&pagina=-1`, `...&pagina=abc`, `...&pagina=999`, `...&pagina=1.5`. Capturas en `capturas/c-pagina-*.png`.
- **Sin JavaScript:** en 390, `http://localhost:3100/buscar?q=LunaPaginacion1790300436266` mostró 24 tarjetas y `Ves 24 de 130 artículos`; “Ver más” hizo navegación normal a `...&pagina=2`, con 48 tarjetas y `Ves 48 de 130 artículos`. Capturas: [página 1](capturas/d-sin-javascript-pagina-1.png), [página 2](capturas/d-sin-javascript-pagina-2.png).
- **Tus publicaciones:** Camila vio `Activas 136`, `Visitas Menos de 10`, `Guardados 0`, 24 tarjetas y `Ves 24 de 136 publicaciones`; `pagina=2` mostró 48. Desde esa página se retiró `LunaPaginacion1790300436266 100`; apareció el aviso exacto `Retiraste «LunaPaginacion1790300436266 100». Ya no se ve en el catálogo; la tienes abajo, en Retiradas, por si la quieres volver a publicar.`, el resumen pasó a `Activas 135` y la tarjeta quedó en `Retiradas`. “Republicar” devolvió `Activas 136` y quitó la sección Retiradas. Capturas: [resumen](capturas/e-tus-publicaciones-pagina-1.png), [retirada](capturas/e-retirada-desde-pagina-2.png), [republicada](capturas/e-republicada.png).
- **Destacado antiguo:** `LunaPaginacion1790300436266 001` apareció primero, con el texto visible `Destacado`, en `http://localhost:3100/buscar?q=LunaPaginacion1790300436266`; al ampliar a `...&pagina=2` siguió arriba una sola vez y no volvió a aparecer más abajo. Capturas: [primera](capturas/f-destacado-pagina-1-confirmacion.png), [página 2](capturas/f-destacado-pagina-2.png).

## Observaciones fuera de alcance

- Las publicaciones sintéticas usaron `seed/demo.jpg` y mostraron el ícono de imagen rota; es un efecto del dato de prueba, no lo atribuyo a estas correcciones.
- No vi otros hallazgos de las filas 33 y 34.

## NO VERIFICADO

- **Tope de 50 páginas con más de 1.200 resultados:** NO VERIFICADO; el mayor lote disponible tuvo 142 resultados. Sí se probó `pagina=999`, que terminó sin error y sin “Ver más”.

---
**Respuesta (2026-09-24):** el hallazgo 1 no es un defecto. El encargo decía «guardar la
búsqueda vuelve a la primera página» y quería decir que la búsqueda **se guarda sin**
`pagina`, no que la pantalla cambie. Comprobado con `e2e/paginacion.spec.ts` («una
búsqueda guardada desde la página 2 se guarda sin la página»): queda
`q=…&orden=precio_desc`. Filas 33 y 34 cerradas.
