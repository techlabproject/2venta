# Respuesta a la ronda de verificación del 2026-09-13

Escrita por el agente de desarrollo después de leer los tres informes
(`informe-funcional.md`, `informe-tecnica.md`, `informe-usuario.md`). Tres agentes
independientes, cada uno interactuando con la interfaz por Playwright; los dos
primeros contra la imagen local del commit `8a62344`, el tercero contra el entorno
`dev` en AWS.

Para cada hallazgo real: primero la prueba que lo reproduce en la suite oficial,
después el arreglo. Once pruebas nuevas; `npm run verify` pasa con 103 unitarias y
252 de navegador.

## Cerrados

### [CRÍTICO, tecnica] El mismo celular verificaba dos cuentas — **real, cerrado**
Era exactamente lo que la D-01 dice impedir. Índice único parcial sobre
`"phoneNumber"` cuando está verificado (migración 0010) y comprobación en
`verifyCode()` con mensaje claro. Se comprueba al confirmar y no al registrarse a
propósito: ahí quien pregunta ya demostró tener el número; al registrarse,
decirle a cualquiera "ese número ya tiene cuenta" regalaría el dato.
Prueba: `auth.spec.ts` "un celular ya confirmado en otra cuenta no confirma una segunda".

### [CRÍTICO ×3, funcional] Título, descripción, alias y razón social sin filtro — **real, cerrado**
La D-22 se había aplicado al chat, la descripción del perfil y las reseñas, pero
no a lo más público de todo. Ahora `moderateListing` (publicar, editar y carga
en lote) rechaza títulos y descripciones con contacto, y el alias y la razón
social también. Se rechaza en vez de ocultar: un título con "•••••" no dice qué
vende. Pruebas en `edit.spec.ts`, `profile.spec.ts`, `store.spec.ts`.

### [ALTO, funcional] Un emoji entre dígitos evadía el filtro — **real, cerrado**
La lista de separadores era cerrada y un emoji son dos unidades de código. El
detector trabaja ahora por puntos de código y admite cualquier cosa que no sea
letra ni dígito entre los dígitos. Al hacerlo salieron dos falsos positivos que
también se cierran: una fecha (`13/09/2026 a las 3`) y una tira de 13 o más
dígitos (un IMEI, un serial) ya no cuentan como teléfono. Un celular son 10
dígitos, 12 con indicativo. Pruebas unitarias en `redact.test.ts`.

### [ALTO, funcional y usuario] Publicaciones no activas con ficha pública y botón de compra — **real, cerrado**
Borrador, en revisión, rechazada y retirada responden 404 salvo para el dueño o
un administrador. Vendida y reservada se siguen viendo (el enlace pudo
compartirse) pero sin botón de compra y con una línea que dice qué pasó. Y el
mensaje del checkout ya no dice "alguien se adelantó" cuando lo que pasa es que
está en revisión. Pruebas en `edit.spec.ts` y `checkout.spec.ts`.

### [ALTO, tecnica] Un byte nulo tumbaba la petición con 500 — **real, cerrado**
Postgres no admite `0x00` en texto. Se quita en la frontera con la base, una sola
vez para todas las consultas (`src/lib/db.ts`), porque no hay uso legítimo de ese
carácter en ningún campo. Prueba en `search.spec.ts` y unitaria en `db.test.ts`.

### [MEDIO, funcional] Editar mostraba el formulario para algo vendido — **cerrado**
Ahora muestra un aviso en vez del formulario. Prueba en `edit.spec.ts`.

### [MEDIO, funcional] Alias repetido — **cerrado, con matiz**
Un alias elegido ya no puede ser el de otra persona (sin distinguir mayúsculas).
No es un índice único: el alias inicial se deriva del nombre ("Catalina R.", D-04)
y dos Catalinas R. son inevitables; lo que se cierra es hacerse pasar a propósito
por alguien concreto. El primer intento con índice único rompió el registro de
todo el que se llamara como otro usuario, y por eso quedó así.

### [MEDIO, usuario] Al vendedor nadie le decía cuánto le queda — **cerrado**
Al escribir el precio en "Publicar" aparece cuánto le llega después de la
comisión y cuánto es la comisión; en su ficha, lo mismo. Prueba en `publish.spec.ts`.

### [BAJO, tecnica] Cabeceras de seguridad — **cerrado en parte**
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y
`Permissions-Policy`, y sin `X-Powered-By`. Sin CSP todavía: Next inyecta scripts
en línea y una CSP mal puesta rompe la aplicación; entra cuando se pueda probar
con nonces. Prueba en `search.spec.ts`.

### [DUDA, funcional] Destacar y retirar — **decidido, D-65**
Al retirar o marcar vendida, el destacado termina y no se devuelve: nadie lo va a
ver y fue el vendedor quien la sacó. Prueba en `promotions.spec.ts`.

## No se cambian, y por qué

- **[DUDA, funcional] Nota de dirección y detalle de reporte sin filtro.** La nota de
  la dirección la ven solo las dos partes del pedido, y el celular de quien
  recibe es un campo legítimo ahí: sin él no hay entrega. El detalle de un reporte
  lo lee un administrador. No son públicos; no aplica la D-22.
- **[MEDIO, usuario] Dos acentos mostaza en el chat con oferta activa.** Es real y
  es de diseño: "Aceptar oferta" debería ser la primaria y "Enviar" secundaria.
  Queda anotado en `NOTES.md` para la siguiente pasada visual, no se toca a ciegas.
- **[MEDIO, usuario] "Crear una cuenta" desde el ingreso pasa por un paso extra.**
  Anotado; es un cambio de flujo que merece mirar el mockup antes.
- **[BAJO, usuario] "coches" en el buscador.** No es un error: en Bogotá un coche
  es un coche de bebé, y está dentro de "niños".
- **[BAJO, usuario] "Choose Files" en inglés.** Es el control nativo del navegador;
  el texto lo pone el sistema del usuario, no la aplicación.
- **[DUDA, usuario] Validación nativa de la dirección.** El servidor rechaza una
  dirección incompleta con mensaje propio (probado); la validación del navegador
  es una capa antes, en el idioma del navegador. Aceptable.
- **[DUDA, tecnica] Límite de ingresos en producción.** Apagado en desarrollo a
  propósito (`rateLimit.enabled: isProduction()`); en producción está activo.

## Lo que aprendí de la ronda

- Tres agentes en paralelo contra la misma base se pisan: `runWorkerOnce` y las
  pruebas que afirman sobre la consola del worker son frágiles, y `tecnica` vio
  su hallazgo crítico desaparecer una vez por el ruido. Para la próxima ronda, un
  agente por base o bases separadas por puerto.
- El agente de usuario se quedó dos veces esperando notificaciones de corridas en
  segundo plano. La instrucción "corre todo en primer plano" tiene que ir en el
  brief desde el principio.
- Las exploraciones de los agentes (`e2e/qa/`) quedan fuera de `verify` y del
  linter a propósito: son evidencia de una ronda, no código del producto.
