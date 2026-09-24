# Informe de prueba — fila 8 de Catalina, segunda vuelta

**Veredicto:** `PASA CON OBSERVACIONES` — el hallazgo original queda corregido: `482-913`, `482 913`, `48-29-13` y escribir `4 8 2 9 1 3` dejan `482913` en 390 y 1280 px. Persisten dos variantes problemáticas: una fecha ISO anterior al código deja `202609`, y un código separado por punto deja `248291`.

## Hallazgos

### 1. Una fecha ISO en el SMS se toma como código antes que el código real

- **Severidad:** media.
- **Ancho:** 390 px y 1280 px.
- **Pasos exactos:** abrir `http://localhost:3100/registro?rol=comprador`; registrar una cuenta nueva con un celular único; llegar a `http://localhost:3100/verificar?rol=comprador`; pegar exactamente `Fecha 2026-09-23, hora 14:30. Tu código de 2venta es 482-913. No lo compartas.` en `Código de seis dígitos`.
- **Esperado:** que se reconozca `482913`, ignorando la fecha, la hora y el `2` de «2venta».
- **Visto:** la caja quedó en `202609` en ambos anchos. La URL exacta fue `http://localhost:3100/verificar?rol=comprador`. Al pulsar `Confirmar celular` en 390 px, se vio exactamente `Ese código no es. Te quedan 4 intentos.` y la URL no cambió.
- **Capturas:** [valor tomado de la fecha en 390 px](capturas-2/02-variantes-fecha-390.png) · [1280 px](capturas-2/02-variantes-fecha-1280.png) · [respuesta del servidor](capturas-2/05-fecha-equivocada-390.png).

### 2. Un código separado por punto se mezcla con el «2» de «2venta»

- **Severidad:** baja; el formato declarado admite guion o espacio, no punto.
- **Ancho:** 390 px y 1280 px.
- **Pasos exactos:** llegar a `http://localhost:3100/verificar?rol=comprador`; pegar exactamente `Tu código de 2venta es 482.913. No lo compartas.`.
- **Esperado:** como variante de seis dígitos separados, que quedara `482913`; como mínimo, que no se mezclara el `2` de «2venta» con el código.
- **Visto:** quedó `248291` en ambos anchos. La URL exacta permaneció `http://localhost:3100/verificar?rol=comprador`.
- **Capturas:** [390 px](capturas-2/10-punto-390.png) · [1280 px](capturas-2/10-punto-1280.png).

## Lo que verificaste y pasa

- El hallazgo original ya no se reproduce: con `Tu código de 2venta es 482-913. No lo compartas.` queda `482913` en 390 y 1280 px. También pasa con `482 913`.
- `48-29-13` queda `482913` en ambos anchos.
- Escribir dígito a dígito con espacios (`4 8 2 9 1 3`) deja `482913`.
- La caja sigue siendo única, grande, legible y sin desbordes; el placeholder exacto es `000000`. Capturas: [390 px](capturas-2/04-hyphen-corregido-390.png) · [1280 px](capturas-2/04-hyphen-corregido-1280.png).
- En el flujo de recuperación de la cuenta nueva, el DOM mostró `type="text"`, `inputmode="numeric"`, `autocomplete="one-time-code"` y placeholder `000000`.
- La cuenta nueva se confirmó desde `/verificar`, se cerró la sesión, se cambió la contraseña a `LunaRecuperada.2026` desde `/recuperar`, esa contraseña permitió iniciar sesión, y un segundo `/recuperar` volvió a `Demo2venta.2026`. El segundo código fue distinto del primero y el acceso con la contraseña original funcionó en `http://localhost:3100/`.
- Capturas del flujo: [código de recuperación](capturas-2/07-recuperacion-codigo-390.png) · [primer cambio](capturas-2/08-recuperacion-temporal-390.png) · [estado restaurado](capturas-2/09-recuperacion-restaurada-390.png).

## Observaciones fuera de alcance

- No se evaluaron costo/documentación del SMS ni el selector de país.
- La variante con punto y la fecha ISO se probaron como entradas adicionales; el formato corregido declarado por producto es dígitos contiguos o separados por guion o espacio.

## NO VERIFICADO

- No se repitió la batería completa de cinco códigos incompletos, código equivocado y reenvío de la primera vuelta; esta segunda vuelta se concentró en las variantes nuevas del saneamiento y en completar los dos ciclos de recuperación.
