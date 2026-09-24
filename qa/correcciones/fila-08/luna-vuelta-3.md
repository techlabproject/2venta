# Informe de prueba — fila 8 de Catalina, tercera vuelta

**Veredicto:** `PASA` — los dos hallazgos de la segunda vuelta quedan corregidos: se toma el último bloque de seis dígitos y se admite el punto como separador. Los mensajes con fecha ISO, dos fechas previas y punto dejan `482913` en 390 y 1280 px; siete dígitos quedan limitados a seis.

## Hallazgos

### 1. El código al principio queda desplazado por una fecha posterior

- **Severidad:** baja, aceptable bajo el contrato actual del SMS.
- **Ancho:** 390 px y 1280 px.
- **Pasos exactos:** llegar a `http://localhost:3100/verificar?rol=comprador`; pegar exactamente `Tu código de 2venta es 482-913. Fecha 2026-09-23, hora 14:30.`.
- **Esperado:** si se interpretara cualquier mensaje, `482913`; pero el SMS real de 2venta escribe el código al final.
- **Visto:** la caja quedó en `202609` en ambos anchos y la URL exacta permaneció `http://localhost:3100/verificar?rol=comprador`.
- **Juicio:** me parece aceptable para el producto actual: es el caso contrario al formato que la aplicación genera y el contrato explícito es que el código va al final. Sería sorprendente para un SMS arbitrario, pero no es un fallo del mensaje que 2venta escribe.
- **Capturas:** [390 px](capturas-3/04-codigo-al-principio-390.png) · [1280 px](capturas-3/04-codigo-al-principio-1280.png).

## Lo que verificaste y pasa

- Repetición exacta de la URL `http://localhost:3100/verificar?rol=comprador` y del mensaje `Fecha 2026-09-23, hora 14:30. Tu código de 2venta es 482-913. No lo compartas.`: quedó `482913` en 390 y 1280 px.
- Repetición exacta de la URL `http://localhost:3100/verificar?rol=comprador` y del mensaje `Tu código de 2venta es 482.913. No lo compartas.`: quedó `482913` en 390 y 1280 px.
- Con dos fechas antes del código —`Fecha 2026-09-23, segunda fecha 2026-09-24, hora 14:30. Tu código de 2venta es 482-913. No lo compartas.`— quedó `482913` en ambos anchos: se tomó el último bloque.
- Escribir dígito a dígito `482913` dejó `482913`.
- Escribir siete dígitos seguidos `1234567` dejó `123456`.
- La caja única grande se vio legible y sin desbordes en 390 y 1280 px. Capturas: [fecha corregida en 390](capturas-3/01-repetida-fecha-390.png) · [punto corregido en 1280](capturas-3/02-repetida-punto-1280.png) · [dos fechas](capturas-3/03-dos-fechas-390.png) · [siete dígitos](capturas-3/06-siete-digitos-390.png).

## Observaciones fuera de alcance

- No se evaluaron costo/documentación del SMS, selector de país ni recuperación de contraseña en esta vuelta corta.

## NO VERIFICADO

- No se repitieron en esta tercera vuelta los flujos de cinco códigos incompletos, código equivocado, reenvío ni recuperación; quedaron cubiertos en las vueltas anteriores.
