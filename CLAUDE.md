# 2venta

Marketplace de segunda mano para Colombia. Bogotá, tres categorías, pago protegido.

# Comandos

- Desarrollo: `npm run dev`
- Base de datos local: `docker compose up -d` (Postgres en 5433)
- Migraciones: `npm run db:push`
- Datos de prueba: `npm run db:seed`
- Verificación completa antes de confirmar cambios: `npm run verify`
  (tipos + linter + pruebas unitarias + siembra + pruebas de punta a punta)

`verify` vuelve a sembrar la base a propósito. Las pruebas crean artículos y
cuentas que se acumulan, y sin reiniciar, cualquier aserción sobre rangos de precio
o sobre resultados de búsqueda empieza a fallar de forma intermitente.

# Método de trabajo

Este proyecto sigue la skill `product-build-loop`. En corto:

- Una rebanada vertical a la vez, cada una con su especificación en `slices/`.
- Ninguna rebanada se cierra sin correr su prueba de punta a punta y mostrar la salida.
- Toda decisión nueva se anota en `DECISIONS.md`; el estado vive en `NOTES.md`.
- `SPEC.md` manda sobre cualquier suposición. Si algo no está ahí, se pregunta.

# Control de calidad independiente

`qa/` tiene los informes de Luna, la verificadora que corre aparte (su prompt está
en `AGENTE-QA.md`). Al empezar una sesión, mirar si hay un informe nuevo: cerrar sus
hallazgos va antes que construir nada más.

Cuando un hallazgo suyo sea real, escribir primero la prueba que lo reproduce y
después el arreglo. Si no se puede reproducir, decirlo así en vez de darlo por
cerrado.

# Convenciones

- Los montos de dinero son enteros en pesos colombianos. Nunca decimales, nunca
  punto flotante. La columna se llama siempre `*_cop`.
- Las fechas se guardan en UTC (`timestamptz`) y se formatean en zona
  `America/Bogota` solo al mostrarlas.
- Los identificadores públicos son UUID, no enteros secuenciales. Un id secuencial
  en una URL deja contar cuántos productos existen.
- Todo texto visible va en español de Colombia.

# Zonas donde hay que bajar la velocidad

Antes de tocar dinero, identidad, datos personales o permisos, lee
`~/.claude/skills/product-build-loop/references/zonas-sensibles.md`.

IMPORTANT: ninguna consulta a base de datos que devuelva datos de una persona sale
sin comprobar en el servidor que quien pregunta tiene derecho a verlos. La interfaz
que oculta el botón no cuenta como control de acceso.

# Gotchas

- El servidor de desarrollo y las pruebas no pueden correr a la vez: Next se niega
  a levantar un segundo servidor sobre el mismo directorio. Hay que parar el
  preview antes de `npm run verify`.
- El contenedor de Postgres corre con configuración regional en inglés. Cualquier
  fecha con nombre de mes se formatea en la aplicación con `Intl`, nunca con
  `to_char` en SQL.
- `dotenv` no lee `.env.local`, eso solo lo hace Next. Los scripts fuera de Next
  tienen que pasarle la ruta explícita.

# Entorno

- Docker Desktop debe estar corriendo antes de `docker compose up`.
- No hay Xcode completo instalado, solo Command Line Tools. Compilar para iOS lo
  va a requerir; hasta la rebanada S-13 no hace falta.
