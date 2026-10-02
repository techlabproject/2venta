# Informe de prueba — 2venta v3 / D-129

Fecha: 1 de octubre de 2026 · navegador Chromium · locale `es-CO`

## Veredicto

| Fila | Resultado | Resumen |
|---|---|---|
| 54 · Excel de Reportes | **NO PASA** | El archivo descarga bien y conserva formatos, pero el periodo por defecto y la métrica de ventas no coinciden con la pantalla. |
| 57 · Crear categorías | **PASA** | Crea el slug corto, aparece en portada y en el selector de publicación. |
| 58 · Borrar | **PASA CON OBSERVACIONES** | Funciona para categorías, tallas, edades y palabras probadas; el caso de un lugar usado quedó sin datos disponibles para probarlo. |
| 59 · Historial | **PASA** | Muestra 10 cambios y carga 10 más aun con JavaScript desactivado. |
| 61 · Empresas por confirmar | **PASA** | El enlace aparece junto a la navegación de moderación y lleva a la sección correcta. |

**Veredicto general: NO PASA**, por la fila 54.

## Hallazgos

### 1. [Severidad media] Fila 54 — el XLSX por defecto no coincide con la pantalla

- **URL:** `http://localhost:3100/admin/reportes`
- **Anchos:** 390 y 1280 px.
- **Pasos:** iniciar sesión como `admin@2venta.demo`; abrir Reportes; dejar el periodo por defecto; comparar la pantalla con `reportes-default.xlsx` leído con ExcelJS.
- **Esperado:** el periodo y las métricas del XLSX deben coincidir con lo mostrado en pantalla.
- **Visto en pantalla:** fechas `2026-09-02` a `2026-10-02` — visualmente `09/02/2026` a `10/02/2026`; `Ventas 12 de 14`; volumen `$ 2.690.000`; comisiones `$ 134.500`; ticket promedio `$ 224.167`; tasa de disputa `0%`.
- **Visto en XLSX:** hojas `Resumen` y `Por categoría`; `Resumen!A2` dice `Del 1 de septiembre de 2026 al 1 de octubre de 2026`; `B5` (`Ventas completadas`) vale `14`; `B6`, `B7` y `B8` valen `2690000`, `134500` y `224167` con formato de pesos; `B10` vale `0`; `B11` vale `0` con formato `0.0%`. La suma de ventas de la hoja por categoría es `8`, mientras la pantalla presenta `12 de 14`.
- **Impacto:** el archivo puede interpretarse como otro periodo y no deja claro cuál es la cifra correcta de ventas completadas.
- **Capturas:** [móvil, periodo por defecto](capturas/05-reportes-default-mobile.png), [escritorio, periodo por defecto](capturas/27-reportes-default-desktop.png), [otro periodo](capturas/06-reportes-otro-periodo-mobile.png).
- **Archivos contrastados:** [reportes-default.xlsx](reportes-default.xlsx), [reportes-otro-periodo.xlsx](reportes-otro-periodo.xlsx).

## Lo que pasa

### Fila 54 — partes que sí funcionan

El enlace exacto `Descargar Excel` genera `.xlsx`, no CSV. Ambos archivos tienen exactamente las hojas `Resumen` y `Por categoría`; los encabezados están en negrita, los montos son números con formato de pesos y `Tasa de disputa` usa formato porcentual. Con `2026-09-01` a `2026-09-15`, la pantalla muestra `Sin ventas` y el XLSX conserva el mismo periodo y ceros. Sin sesión de equipo, `/admin/reportes` muestra el 404 de la aplicación en ambos anchos: [móvil](capturas/07-reportes-sin-equipo-mobile.png) y [escritorio](capturas/28-reportes-sin-equipo-desktop.png).

### Fila 57 — categorías

En `/admin/configuracion`, agregué `Artículos de hogar`. La aplicación mostró `Nombre (articulos-de-hogar)`, y el enlace de portada quedó como `/?categoria=articulos-de-hogar`: [configuración](capturas/12-categoria-agregada-mobile.png), [portada](capturas/13-categoria-home-mobile.png). En `/publicar`, el selector `Categoría` incluyó `Artículos de hogar`: [formulario de publicación](capturas/16-publicar-form-mobile.png).

También probé dos cambios seguidos en secciones distintas: se agregó una categoría `Luna 83918` y después la palabra prohibida `luna-secuencial-83918`; tras el segundo envío, ambas aparecieron en la misma pantalla sin recarga manual: [captura](capturas/21-dos-cambios-config-mobile.png).

### Fila 58 — borrado y protección

- `tecnologia` conserva el texto exacto `La usan 69 publicaciones o pedidos: solo se puede desactivar.` y no tiene `Borrar`: [fila usada](capturas/24-used-category-no-delete-mobile.png).
- Una categoría sin uso mostró `Borrar`; al abrirlo aparecieron `¿Seguro? No se puede deshacer.` y `Sí, borrar`: [confirmación](capturas/23-confirmacion-borrar-mobile.png).
- En la prueba de manipulación, cambié el `slug` oculto del formulario de borrado de una categoría de prueba a `tecnologia`. La categoría usada no se borró, siguió visible y no apareció un registro `Borrado` para ella: [resultado](capturas/17-forzar-borrado-usado-mobile.png).
- Se observaron controles equivalentes en opciones sin uso, mientras opciones usadas no tenían `Borrar`: talla `XS` frente a `M`, y edad `6 a 12 meses` frente a `0 a 6 meses`: [talla XS](capturas/31-talla-XS.png), [talla M](capturas/31-talla-M.png), [edad con borrado](capturas/31-edad-6-a-12-meses.png), [edad usada](capturas/31-edad-0-a-6-meses.png).
- Las palabras prohibidas de prueba mostraron `Desactivar`, `Borrar` y la confirmación: [palabra prohibida](capturas/25-word-luna-secuencial-83918.png).

### Fila 59 — historial

Con una sesión autenticada reutilizada y JavaScript desactivado, la tabla mostró 10 cambios y el enlace `Ver 10 más` con `?historial=20#historial`. Al activarlo, mostró 20 filas y dejó el siguiente enlace `?historial=30#historial`: [10 cambios](capturas/18-historial-10-mobile-js-off.png), [20 cambios](capturas/19-historial-siguiente-mobile-js-off.png), [escritorio](capturas/20-historial-siguiente-desktop-js-off.png).

### Fila 61 — moderación

En `/admin`, junto a `Disputas`, `Configuración`, `Cuentas` y `Reportes`, aparece `Empresas por confirmar`. En este estado no había empresas pendientes, por lo que no se mostró número; el enlace tiene destino `#empresas` y al pulsarlo lleva a `/admin#empresas`: [móvil](capturas/08-admin-mobile.png), [escritorio](capturas/09-admin-desktop.png).

## Observaciones fuera de alcance

- No se modificó el código de la aplicación ni se reinició el servidor.
- No se completó una publicación real con video; para la fila 57 se verificó que la categoría aparece en el formulario de publicación.
- Pagos, identidad y transportadora no se reportan como fallos por estar simulados, conforme a las instrucciones.
- Las categorías, palabras y demás datos creados para la prueba fueron eliminados al terminar; la categoría de prueba ya no aparece en la portada: [verificación de limpieza](capturas/29-cleanup-home-mobile.png).

## NO VERIFICADO

- Fila 58, caso específico de un **lugar usado**: los lugares disponibles en el estado probado mostraron `Borrar`; no había un lugar con mensaje `La usan N publicaciones o pedidos` para forzar ese caso sin tocar datos existentes.
- No se probaron más combinaciones de fechas de Reportes fuera del periodo por defecto y `2026-09-01` a `2026-09-15`.
