# Rebanada S-25 — Validación de configuración y reportes de negocio

Dos cosas sin relación entre sí, juntas porque las dos son cortas.

## Parte 1: validación de configuración

### Qué hace

Al arrancar, la aplicación comprueba que estén todas las variables de entorno que
necesita, y si falta alguna se detiene diciendo cuáles y para qué sirve cada una.

### Por qué

Hoy una variable que falta se descubre tarde y mal. `PICKUP_CODE_SECRET` revienta la
primera vez que alguien compra en persona, no al arrancar. El secreto de los
webhooks hace que las firmas nunca validen, y el síntoma es que los pagos no se
confirman, sin ninguna pista de por qué.

Eso va a morder justo el día del despliegue, que es el peor día para descubrirlo.

### La decisión: se listan todas de una vez

Detenerse en la primera que falte obliga a un ciclo de prueba y error: se agrega
una, se reinicia, falla la siguiente. Se comprueban todas y se listan todas.

### Y otra: en desarrollo no se exige lo de producción

En desarrollo faltan a propósito el proveedor de SMS, el de pagos real y el dominio.
Exigirlos ahí haría imposible trabajar. La lista de obligatorias depende del
entorno, y la de producción es más larga.

## Parte 2: reportes de negocio (RF-42)

### Qué hace

Una pantalla de administración con las cifras del negocio en un periodo: ventas,
volumen transado, comisiones cobradas, ticket promedio, tasa de disputa y desglose
por categoría. Se puede descargar como archivo separado por comas.

### Por qué

Es el RF-42, el último requisito funcional sin construir. Estaba en prioridad baja y
lo está: nadie lo necesita para que la plataforma funcione. Se hace porque cerrar la
lista tiene valor propio.

### La cifra que importa

De todas, la tasa de disputa es la única que dice si el producto está funcionando.
Tu objetivo escrito es menos del 5%; si sube, significa que la verificación previa
no está sirviendo, que es la apuesta entera del negocio.

Por eso va destacada y con el objetivo al lado, no perdida en una tabla.

## Archivos que toca

- `src/lib/config.ts` — la validación
- `instrumentation.ts` — el arranque
- `src/features/reports/` — las consultas
- `src/app/admin/reportes/page.tsx`
- `src/app/api/admin/reportes.csv/route.ts`
- `e2e/reportes.spec.ts`

## Explícitamente fuera

- Gráficas. Una tabla y un archivo descargable bastan para lo que se necesita.
- Comparación con periodos anteriores.
- Reportes para el vendedor. Sus métricas están en S-15.

## Prueba de punta a punta

1. Falta una variable obligatoria y la aplicación lo dice al arrancar, con la lista
   completa y no solo la primera.
2. Un administrador ve las cifras del periodo.
3. La tasa de disputa se calcula sobre las ventas completadas.
4. El archivo se descarga y trae las mismas cifras.

## Casos de fallo con prueba

- Quien no es administrador recibe 404 en la pantalla y en el archivo.
- Un periodo sin ventas no divide por cero.
- Un periodo con fechas inválidas se ignora en vez de romper.

## Depende de

S-24.
