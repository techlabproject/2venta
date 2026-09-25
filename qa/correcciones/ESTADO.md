# Estado de las correcciones de Catalina — leer esto primero al retomar

Última actualización: 2026-09-25. Registro fila por fila: `2026-09-22.md` (52 filas).
Lista de problemas y pendientes para el documento final: `pendientes.md`.

## Cómo se trabaja (acordado con Nicolás)

1. Por fila: explicar el contexto (cómo está hoy, qué pide Catalina, qué cambia para
   la persona, qué otras filas toca) y **preguntar las decisiones con AskUserQuestion**
   (memoria `preguntas-con-contexto`).
2. Construir con prueba e2e (la prueba que reproduce primero). Verificar tipos, lint,
   unitarias y las specs relacionadas.
3. **Luna** = Codex `gpt-5.6-luna`, esfuerzo `xhigh`, en su propio directorio del
   scratchpad, con sandbox `workspace-write` + red. Chromium no corre dentro del
   sandbox: el navegador vive afuera (`scratchpad/luna/servidor-navegador.mjs`,
   escribe `ws.txt`) y Luna se conecta con `chromium.connect(ws)`. Ayudante de
   códigos SMS: `scratchpad/luna/codigo-sms.sh`. Encargos base en
   `qa/correcciones/fila-NN/encargo.md`. Retomar su sesión: `codex exec resume <id>`
   (el id sale con `grep -a "session id" codex.log`; sin `-a` falla en silencio).
   Antes de lanzarla: `BETTER_AUTH_URL=http://localhost:3100 npm run demo -- --limpiar-pruebas`.
   Después, para las pruebas propias: `npm run db:seed` (la demo rompe las specs que
   buscan los 3 artículos sembrados).
4. Corregir lo que encuentre y repetir hasta que pase. Guardar sus informes en
   `qa/correcciones/fila-NN/` (solo las capturas de los hallazgos).
5. **Sin commit ni push hasta que Nicolás apruebe la fase** (memoria
   `aprobar-antes-de-commit`). Pausas con resumen cuando él lo pida. Veredicto final
   de cada fase: suite completa contra la imagen
   (`docker compose --profile imagen up -d --build app` y
   `E2E_BASE_URL=http://localhost:3200 npx playwright test --workers=3`).

## Dónde vamos

- Filas 1–8: hechas y **desplegadas** en `dev` (commits 65e3d94, e9ec62d, b6559cc;
  b7df4b9 arregló el CI: MinIO pasó a imágenes de Chainguard).
- Filas 9, 10, 50: decididas y documentadas, **sin confirmar** (D-107,
  `docs/alcance/verificacion-celular.md`).
- **Fila 11: hecha, sin confirmar** (D-108; Luna PASA en la vuelta 3).
- **Fila 12: hecha, sin confirmar** (D-109; sin @usuario; `docs/alcance/identidad-y-llaves.md`).
- **Fila 13: hecha, sin confirmar** (D-110; Luna PASA en la vuelta 2).
- **Fila 14: hecha, sin confirmar** (se quitó la frase; Nicolás no quiso pasada general de textos: las demás frases parecidas están en `pendientes.md` y se tratan en sus filas).
- **Fila 15: hecha, sin confirmar** (D-111; Luna PASA en la vuelta 2; detalle abajo).
- **Fila 16: resuelta por la 15** (ya no hay pantalla de registro de tienda).
- **Fila 17: hecha, sin confirmar** (D-112; Luna PASA en la vuelta 2; `e2e/empresa-no-compra.spec.ts`).
- **Fila 18: hecha, sin confirmar** (D-113; ya la resolvía la fila 1; Luna pasa con una observación baja anotada en `pendientes.md`).
- **Filas 19, 20 y 22: hechas, sin confirmar** (D-114; `docs/alcance/chat.md`; `e2e/chat-en-vivo.spec.ts`). **Fila 21: en evaluación** (fotos del chat se quedan).
- **Fila 23: resuelta por la fila 1.** Luna probó 19–23 juntas: vuelta 2 PASA (`fila-19-23/`).
- Filas 9–23 **aprobadas y desplegadas** en `dev` (commit f28ce10, CI verde).
- **Filas 24 y 25: hechas, sin confirmar** (D-115; Luna PASA).
- **Filas 26 a 32: hechas, sin confirmar** (D-116; migración 0019; Luna PASA).
- **WhatsApp Cloud para los códigos: construido, sin confirmar** (D-117; `src/lib/whatsapp.ts`, `src/lib/sms.ts`, `/api/whatsapp/webhook`, migración 0020, Terraform en dos pasos, `infra/LEEME.md`). Código válido 10 min en registro y recuperación. Falta que Nicolás rote y cargue los secretos.
- Filas 24–32 y WhatsApp **aprobadas y desplegadas** (commit 25a06dc).
- **Filas 33 y 34: hechas, sin confirmar** (D-118; `e2e/paginacion.spec.ts`; Luna PASA).
- **WhatsApp en Meta (2026-09-24):** plantilla `codigo_verificacion` rechazada al crear («la cuenta no tiene permiso») — el portafolio «Boteame» no está verificado; cambio del nombre visible del número +57 311 5705501 a «2venta» enviado, **en revisión**. Ver `pendientes.md`.
- **Filas 35 a 40: hechas, sin confirmar** (D-119; migraciones 0021 y 0022).
- **Fila 41: hecha, sin confirmar** (texto de Guardados y Avisos que eligió Nicolás; Luna
  vuelta 1 no pasa —un guardado retirado desaparecía—, arreglado: pasa a «Ya no están»
  sin enlace; vuelta 2 PASA).
- **SMS por Twilio (D-120): construido, sin confirmar**; cuenta de prueba de Nicolás
  creada, SMS de prueba recibido. La cuenta de prueba rechaza texto propio (572006):
  los códigos salen por **Twilio Verify** (Twilio genera y comprueba el código;
  migración 0024 `verificado_por`). Envío real por el código de la app comprobado.
- **Filas 42–49, 51, 52: propuesta escrita, decide Nicolás** (`docs/alcance/`:
  `sesiones.md`, `ubicacion.md`, `encuentro-seguro.md`, `impuestos-y-envio.md`,
  `administracion.md`, `proveedores-identidad.md`). No se construye nada hasta que decida.
- **Resumen de cierre:** `CIERRE.md`. Informe para Catalina publicado como artefacto
  (ver el mensaje final de la sesión del 2026-09-25).
- **Esperan aprobación para commit y despliegue:** filas 33–41, Twilio/Verify y el
  destino de IAM en `.github/workflows/desplegar-dev.yml`.
- **Veredicto de la fase (2026-09-25):** unitarias 164/164; tipos y linter sin errores;
  suite completa contra la imagen **418/418** en 4,5 min (primera pasada 414/418: cuatro
  pruebas de `search.spec` y `kyc.spec` esperaban lo sembrado en la primera página y,
  con 24 por página, lo acumulado por la suite lo empujaba a la segunda; ahora buscan
  por palabra; 30/30 con la base acumulada).
- **Pedido de Nicolás (2026-09-25):** sin nombres de personas en los textos de ejemplo:
  registro («Nombre y apellido», «nombre@gmail.com»), quién recibe el envío y el error de
  correo sin nada antes de la @. Hecho, sin confirmar.
- **Fila 42: hecha, sin confirmar** (D-121; «Cerrar todas las demás»; Luna PASA).
- **Filas 43, 44, 45 y 51: en curso** (D-122). Decisiones de Nicolás: ubicación como
  Marketplace — distancia aproximada y radio; ubicación del vendedor **en el perfil**
  («Usar mi ubicación» o la localidad), guardada en cuadrícula de ~1 km; tarjeta
  «Chapinero · a unos 3 km»; radio **opcional** (2/5/10/20 km) y orden «Más cerca»;
  **Bogotá y municipios vecinos** (Soacha, Chía, Cajicá, Cota, Funza, Mosquera, Madrid,
  La Calera); **solo Bogotá** por ahora (nada de otras ciudades). La ubicación del
  comprador va en una cookie, nunca en la URL ni en la base. La zona deja de ser texto
  libre (19 localidades urbanas + 8 municipios); `zone` deja de ser escribible por
  `/api/auth/update-user`.

## Fila 11 (términos y condiciones) — cerrada; se deja el detalle como referencia

Decisiones de Nicolás: borrador investigado, **versión 1** marcada en revisión legal;
**panel deslizable** con todo lo legal y «Aceptar» al final (no páginas sueltas);
guardar versión y fecha de aceptación; datos de la empresa **pendientes**; **fecha de
nacimiento** y no dejar registrar menores de 18; **autorización de biométricos ya**;
dirección del vendedor (art. 53) **con la fila 15**.

Hecho (tipos y lint en verde; 54 pruebas de auth pasaron antes de los cambios de
edad y biométricos):
- `src/features/legal/` — `ContenidoLegal.tsx` (texto v1, 14 secciones; notas «Para
  revisión legal» con clase `nota-abogado`, ocultas en el panel y visibles en
  `/legal`), `PanelLegal.tsx`, `VerTerminos.tsx`, `version.ts`.
- `src/app/legal/page.tsx`; `RegisterForm.tsx` (casilla abre el panel, se acepta al
  final, manda `termsVersion`); `src/app/cuenta/page.tsx` (sección «Términos y datos
  personales»); `src/lib/auth.ts` (additionalFields `termsVersion`/`termsAcceptedAt`,
  `databaseHooks` pone la fecha, hook exige `TERMS_REQUIRED` y bloquea
  `TERMS_READONLY` en `/update-user`); migración `0015_aceptacion_de_terminos.sql`.
- `db/demo.mts` manda `termsVersion`. Helper e2e `aceptarTerminos(page)` usado en 14
  specs. `e2e/terminos.spec.ts` (6 pruebas).
- Luna vuelta 1 = NO PASA; arreglados #2 (retracto y reversión redactados), #6 (área,
  vigencia, procedimiento), #7 (contraseña = hash, no «cifrada»), #8 (notas ocultas en
  el panel). #1 y #5 quedan pendientes por decisión.
- #4 biométricos: casilla obligatoria `autorizoBiometricos` en `/vender` antes de
  «Empezar verificación»; `beginVerification(form)` la exige (si falta →
  `/vender?autorizacion=falta`); `startVerification` guarda `biometric_consent_at`.
  Migración `0016_edad_y_biometricos.sql` (aplicada). Las specs que empiezan la
  verificación ya marcan `getByLabel(/Autorizo que el proveedor/)` — **sin correr aún**.
- #3 edad: `src/lib/edad.ts` + `edad.test.ts` (pasan). **Falta conectarlo.**

Hecho también (2026-09-24, tarde): pasos 1 a 5 de la lista anterior — fecha de
nacimiento en el registro (`CampoValidado` type=date), hook del servidor
(`BIRTHDATE_REQUIRED`/`UNDERAGE`, `birthDate` bloqueado en `/update-user`), demo con
`birthDate`, specs con la fecha y pruebas nuevas de edad y biométricos, texto legal
actualizado. **84 de 84** en las specs de auth/kyc/publish/términos/correo/celular/
código/volver/recuperar; unitarias en verde.

Luna vuelta 2 = NO PASA por detalles, arreglados: reintegro del retracto a 15 días
calendario (art. 47 modificado por la Ley 2439/2024), todas las excepciones del
art. 47, franja para cerrar el panel en móvil, códigos `INVALID_BIRTHDATE` y
`BIRTHDATE_READONLY`. `e2e/terminos.spec.ts`: 9 de 9.

Luna vuelta 3 = PASA. Fila cerrada (informes en `fila-11/`, D-108).


## Fila 15 (persona natural / jurídica) — cerrada; se deja el detalle como referencia

Decisiones de Nicolás (2026-09-24):
- Se elige **al empezar a vender** (en `/vender`), no al registrarse: el registro de
  comprador no cambia. Desaparece «Registra tu tienda» (`/tienda`) como paso aparte.
- **Persona natural:** dirección de notificaciones + teléfono (art. 53, pendiente de
  la fila 11) + verificación de identidad (cédula y selfie, con la autorización de
  biométricos ya hecha en la fila 11).
- **Persona jurídica:** NIT, razón social, nombre y cédula del representante legal
  (él hace la verificación de identidad), dirección de notificaciones, teléfono y el
  **RUT en PDF** para revisión manual mientras no haya proveedor que valide el NIT.
- **Carga en lote solo para personas jurídicas.**
- **Tiendas existentes:** pasan a ser **personas naturales**; quien quiera vender como
  empresa se registra de nuevo como persona jurídica (interpretación de «como
  personas naturales y una nueva como jurídica»; confirmar con Nicolás si hay duda).

Plan técnico (hoy: `stores` = user_id, legal_name, nit único; `kyc_verifications`
por usuario; insignia de tienda por `stores` en `catalog/queries.ts`
—`seller_is_store`, `is_store`— y `ListingCard`, `vendedor/[id]`; `/tienda` con
`registerStore` y `uploadBulk` en `src/features/store/`):
1. Migración 0017: tabla `vendedores` (user_id pk, tipo `natural|juridica`,
   direccion_notificaciones, telefono, creado) y en `stores` columnas del
   representante (nombre, cédula), `rut_path`, `nit_confirmado_at` y `archivada_at`;
   marcar `archivada_at` en las tiendas existentes (pasan a naturales; no se borra).
2. `/vender` sin verificar: paso 1 elegir tipo; paso 2 formulario del tipo; paso 3
   autorización de biométricos + «Empezar verificación». Acción de servidor que valida
   todo (NIT con `src/features/store/nit.ts`), guarda y arranca el KYC.
3. RUT: subida prefirmada tipo `rut` (PDF) — `requestUpload`/`claim` hoy aceptan
   video/imagen/avatar/prueba; agregar PDF con comprobación de tipo real.
4. Admin: ver el RUT y «Confirmar NIT» en `/admin/usuarios`; la insignia de empresa y
   la carga en lote solo con `nit_confirmado_at` y sin `archivada_at`.
5. `/tienda` → redirige a `/vender`; carga en lote se mueve bajo `/vender` para
   jurídicas. Ajustar textos que mencionen «tienda».
6. Pruebas: e2e de los dos caminos, rechazo de NIT inválido, lote bloqueado a
   naturales, tiendas archivadas sin insignia; actualizar `store.spec.ts` y demás.
7. Luna; D-111; registro; `pendientes.md`; `ContenidoLegal` (sección 4, art. 53 ya
   cumplido) y subir a versión 2 de los términos si el texto cambia.

Avance fila 15 (2026-09-24): hechos los pasos 1, 2, 4 y 5 — migración 0017
(`vendedores`; `stores` con representante, `rut_pdf` **en la base, no en el bucket
público**, `nit_confirmado_at`, `archivada_at`; tiendas existentes archivadas; NIT
único solo entre vigentes), `src/features/sellers/` (queries, reglas, acciones
`empezarComoVendedor` y `completarDatosVendedor`, formularios, `admin.ts` con
`confirmarNit`), `/vender` con elección de tipo (`?tipo=natural|juridica`) y aviso
para vendedores sin datos, `/tienda` solo para jurídica confirmada (se quitó
`registerStore`), insignia de empresa solo con NIT confirmado, `/admin` con
«Empresas por confirmar» y `/admin/rut/[userId]` (solo admin). `next.config.ts`:
`bodySizeLimit` 3 MB. Paso 3 cambió: el RUT no usa subida prefirmada.
Pruebas hechas: `store.spec.ts` reescrito (16 pruebas: empresa + confirmación del
equipo, RUT solo para admin, NIT normalizado/inválido/repetido, RUT que no es PDF,
dirección, persona natural sin lote, tienda archivada sin insignia, vendedor viejo
completa datos); specs con KYC por pantalla pasan por `?tipo=natural` + dirección.
Texto legal (secciones 4 y 13) actualizado; se mantiene «versión 1» mientras sea
borrador, por instrucción de Nicolás.
Luna vuelta 1: PASA CON OBSERVACIONES → arreglado: NIT repetido ya no deja atascado (se guarda  después de la empresa;  muestra el formulario si la verificación no arrancó; «Cambiar mis datos de vendedor» en el reintento), mensaje propio sin la autorización, doble punto «S.A.S..», y el formulario ya no se borra tras un error (). 28/28 en store+términos.
Luna vuelta 2: PASA sin hallazgos nuevos. Fila cerrada (informes en `fila-15/`, D-111). No verificado por Luna: la insignia en una tarjeta de artículo activa (sí lo cubre `store.spec.ts`).
