# Sesiones activas: cómo funcionan

Corrección 42 de Catalina: «¿Cómo almacena las sesiones activas? Confirmar si es en
verdad una funcionalidad.» **Sí es una funcionalidad** (RF-05 del SPEC) y funciona así:

- **Qué es una sesión:** cada vez que alguien entra (en un celular, un computador, un
  navegador distinto) se crea una fila en la tabla `session` de la base, con un
  identificador aleatorio, la fecha de creación y de vencimiento, y el navegador desde
  el que se entró (`userAgent`). En el navegador queda una cookie con un token
  aleatorio; la contraseña nunca se guarda en la sesión.
- **Quién la maneja:** la biblioteca de autenticación (Better Auth). No se implementó a
  mano (D-27).
- **Cuánto dura:** 7 días desde la última actividad (lo que trae la biblioteca por
  defecto); se renueva sola mientras la persona use la app.
- **Dónde se ven:** «Tu cuenta» → «Sesiones abiertas»: una fila por dispositivo, con el
  sistema y el navegador («Android · Chrome») y la fecha. La sesión actual dice que es esta; las demás tienen «Cerrar».
- **Cerrar una sesión** borra esa fila: el otro dispositivo queda fuera al siguiente
  clic. Solo se pueden cerrar sesiones propias (la consulta lo exige con el id del
  dueño, no la pantalla).
- **«Cerrar todas las demás»** (con más de una sesión abierta) cierra todas menos la
  que se está usando: para cuando se pierde el celular o se entró en un computador
  ajeno (D-121).
- **Se cierran todas solas** al cambiar la contraseña (recuperación) y al suspender la
  cuenta.

## Lo que falta o se puede mejorar

- La ciudad aproximada de cada sesión, por IP (hoy no se guarda la ubicación).
- Avisar por correo o SMS cuando alguien entra desde un dispositivo nuevo.
