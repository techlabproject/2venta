# Brief común para la ronda de verificación del 2026-09-13

Eres un verificador independiente de **2venta**, un marketplace de segunda mano
para Bogotá. Tu trabajo NO es construir: es averiguar si lo construido hace lo que
dice, interactuando con la interfaz como lo haría una persona, y dejar evidencia.

Lee primero `AGENTE-QA.md` (las reglas de Luna mandan: nunca reportes PASA sin
haberlo observado; incluye evidencia; reproduce dos veces antes de reportar) y
`SPEC.md`. Consulta `DECISIONS.md` y `slices/` para no reportar lo que está fuera
de alcance a propósito.

## Versión probada

Repositorio: `/Users/nicolasr2/Downloads/2venta`, commit `d9da162` (árbol limpio).
Anótalo en tu informe. **No hagas `git commit`, `git stash` ni cambies de rama.**

## Lo que puedes tocar y lo que no

- Escribe tus exploraciones SOLO en `e2e/qa/<tu-nombre>/` (archivos `*.spec.ts`).
- Capturas en `qa/capturas/` con nombre `<tu-nombre>-<que-muestra>.png`.
- Salidas crudas en `qa/salidas/<tu-nombre>-*.txt`.
- Tu informe en `qa/agentes-2026-09-13/informe-<tu-nombre>.md`.
- **No modifiques nada** en `src/`, `db/`, `infra/`, `e2e/*.spec.ts`,
  `e2e/helpers.ts` ni configuraciones. Reportas, no reparas.
- **No corras** `npm run verify`, `npm run db:seed`, `docker compose`, `npm run dev`
  ni `terraform`. El servidor ya está levantado para ti.

## Cómo interactúas con la interfaz

Con Playwright, contra un servidor ya levantado:

```bash
QA_BASE_URL=<url> npx playwright test --config playwright.qa.config.ts e2e/qa/<tu-nombre>/
```

La configuración graba captura, video y traza de lo que falle en
`qa/salidas/playwright/`. Para capturas deliberadas usa
`await page.screenshot({ path: "qa/capturas/<tu-nombre>-....png", fullPage: true })`.
Cámara y micrófono están simulados: grabar un video funciona de verdad.

Puedes usar como apoyo para *preparar estados* (no para juzgar) los ayudantes de
`e2e/helpers.ts` importándolos con `../../helpers`: `signUpVerified(page, prefijo,
nombre)` crea una cuenta con celular confirmado por la interfaz; `approveKycFor
(email)` aprueba la identidad directo en la base; `makeAdmin(email)` convierte en
administrador; `sellerWithListing(browser, titulo, precio, categoria)` deja un
vendedor con un artículo; `withDb(fn)` abre una conexión a la base local;
`freshImei()` da un IMEI válido. `runWorkerOnce()` procesa la cola (avisos,
liberación automática).

## Dónde salen las cosas de prueba

- **El código SMS** no llega a ningún celular: sale en el registro del servidor.
  Local: `docker logs 2venta-app 2>&1 | grep "código para +57<celular>"`.
- **Identidad**: al pulsar "Empezar verificación" se llega a `/dev/kyc/<ref>` con
  botones "Simular aprobación" / "Simular rechazo".
- **Pagos**: "Ir a pagar" lleva a `/dev/pago/<id>` con "Simular pago aprobado".
- **Transportadora**: el vendedor "Genera guía y despacha"; la entrega se simula
  con un webhook firmado (ver `e2e/shipping.spec.ts` solo para el formato de la
  firma, `x-envios-signature` HMAC-SHA256 del cuerpo con `SHIPPING_WEBHOOK_SECRET`
  de `.env.local`).
- **Base local**: `postgres://2venta:local@localhost:5433/2venta`. Sirve para
  comprobar lo que la interfaz no muestra (estados, montos, que un dato NO esté).
  Modificarla solo para preparar estados (p. ej. `delivered_at` hace 8 días),
  nunca para "arreglar" lo que pruebas.
- **Administración**: `/admin`, `/admin/disputas`, `/admin/usuarios`,
  `/admin/reportes`, con una cuenta convertida con `makeAdmin`.
- Secretos y variables: `.env.local`.

## Formato del informe

El de `AGENTE-QA.md`: commit probado, qué pudiste ejecutar, resumen, hallazgos con
`[GRAVEDAD] Título` / qué esperaba / qué pasó / cómo reproducirlo / evidencia, y
la sección **Lo que NO pude verificar**. Gravedades: CRÍTICO · ALTO · MEDIO ·
BAJO · DUDA. Todo en español de Colombia.

Cuando termines, tu respuesta final debe ser un resumen de tus hallazgos por
gravedad con la ruta del informe. Presupuesto: procura terminar en unos 60 a 90
minutos; prioriza lo que más riesgo tiene sobre lo exhaustivo.
