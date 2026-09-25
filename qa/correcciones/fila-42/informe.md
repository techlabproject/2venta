# Informe de prueba — corrección 42

**Veredicto: PASA** — las sesiones propias se muestran y revocan correctamente, “Cerrar todas las demás” respeta la sesión actual, el aislamiento entre cuentas resistió la manipación probada y los textos de ejemplo no muestran nombres de personas.

## Hallazgos

No se encontraron hallazgos observables dentro del alcance probado.

## Lo que verifiqué y pasa

- **A — tres sesiones y cierre masivo.** En `/cuenta`, a 390 px, Laura vio tres filas con dispositivo, fecha, `· esta`, `Cerrar` y `Cerrar todas las demás`. Tras pulsarlo quedó solo la sesión actual y desapareció el botón. Los otros dos contextos de 1280 px fueron enviados a `/ingresar` en la siguiente navegación. Capturas: `A-01`, `A-02`, `A-03`, `A-04`.

- **B — cierre individual y estado de una sola sesión.** Con una sesión no aparecieron `Cerrar` ni `Cerrar todas las demás`. Con dos sesiones, `Cerrar` eliminó la otra fila y volvió a quedar una sola. Capturas: `B-01`, `B-02`, `B-03`.

- **C — aislamiento entre cuentas.** Adulteré el `sessionId` oculto de Andrés con el identificador de una sesión de Laura. La lista de Andrés no cambió y la sesión de Laura siguió visible. Capturas: `C-02`, `C-03`, `C-04`.

- **C — sesión ya revocada.** Después de revocar una sesión desde otro contexto, la pantalla vieja pulsó `Cerrar todas las demás` y terminó en `http://localhost:3100/ingresar`, mostrando `Iniciar sesión`. Capturas: `C-05`, `C-07`.

- **D — ejemplos de registro y correo inválido.** En `/registro`, a 390 px, vi exactamente `Nombre y apellido` y `nombre@gmail.com`. Con `@gmail.com` apareció: `Falta lo que va antes de la @, por ejemplo nombre@gmail.com.` No vi otros nombres de personas en textos de ejemplo visibles. Capturas: `D-01`, `D-02`.

- **D — “Quién recibe”.** En `/comprar/93ea76d4-c67f-426d-83c9-942c6ca93a19`, a 390 px, `Te lo enviamos` estaba seleccionado y el campo `Quién recibe` tenía el ejemplo `Nombre y apellido`. No se pagó. Captura: `D-03`.

- **E — comparación con `docs/alcance/sesiones.md`.** Lo observable coincide: filas por dispositivo y navegador, fecha, sesión actual marcada `· esta`, cierre individual propio y `Cerrar todas las demás` solo con más de una sesión.

## Observaciones fuera de alcance

- En la ficha del artículo se vio el alias real del vendedor `Andrés M.`; no era un texto de ejemplo.

## NO VERIFICADO

- No verifiqué directamente la tabla `session`, Better Auth, el contenido de la cookie ni el almacenamiento de contraseñas.
- No esperé siete días ni comprobé renovación por actividad.
- No probé que cambiar la contraseña o suspender la cuenta cierre todas las sesiones.