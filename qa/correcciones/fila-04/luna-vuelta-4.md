# Informe de prueba — cuarta vuelta, fila 4

**Veredicto: `PASA` — 41, 200 y 5.000 dígitos bien formados se tratan correctamente como el máximo de la base; mínimos y máximos funcionan en `/buscar` y `/api/buscar/conteo`, sin HTTP 500.**

## Hallazgos

Ninguno en esta vuelta.

## Lo que verifiqué y pasa

- **41 dígitos:** con `min` en `/buscar` se obtienen 0 resultados; con `max`, 12 resultados. `/api/buscar/conteo` responde `{"total":0}` para `min` y `{"total":12}` para `max`. Todas las respuestas fueron HTTP `200`. [Buscar mínimo](capturas-4/buscar-min-41-digitos.png), [buscar máximo](capturas-4/buscar-max-41-digitos.png), [API mínimo](capturas-4/api-min-41-digitos.png) y [API máximo](capturas-4/api-max-41-digitos.png).

- **200 dígitos:** el mismo comportamiento: mínimo con 0 resultados y máximo con 12, tanto en `/buscar` como en `/api/buscar/conteo`; todo HTTP `200`. [Buscar mínimo](capturas-4/buscar-min-200-digitos.png), [buscar máximo](capturas-4/buscar-max-200-digitos.png), [API mínimo](capturas-4/api-min-200-digitos.png) y [API máximo](capturas-4/api-max-200-digitos.png).

- **5.000 dígitos:** el servidor aceptó las cuatro solicitudes —`min` y `max` en `/buscar` y en `/api/buscar/conteo`— con HTTP `200`. Los mínimos dieron 0 resultados/`{"total":0}` y los máximos 12 resultados/`{"total":12}`. No fue necesario un rechazo por URL demasiado larga y no apareció ningún 500. [Buscar mínimo](capturas-4/buscar-min-5000-digitos.png), [buscar máximo](capturas-4/buscar-max-5000-digitos.png), [API mínimo](capturas-4/api-min-5000-digitos.png) y [API máximo](capturas-4/api-max-5000-digitos.png).

- No apareció `This page couldn’t load`, `A server error occurred. Reload to try again.` ni ninguna pantalla de error de la aplicación.

## Observaciones fuera de alcance

- Fila 5: no evalué el texto de cero resultados.
- Fila 33: no evalué la paginación.
- Fila 37: no evalué el nombre `Niños`.
- Fila 24: no evalué el precio al publicar o editar.

## NO VERIFICADO

- No volví a probar la inclusión de artículos exactamente en `$50.000`, `$200.000` o `$1.000.000`.
- No probé vocalización con un lector de pantalla real.
- No repetí en esta vuelta el repaso visual de rangos y campos a 390 px.
