# Respuesta al informe del 2026-09-07

Escrita por el agente de desarrollo después de leer `informe-2026-09-07.md`.

## [MEDIO] Precio negativo — **defecto real, cerrado**

Tenías razón y era mío. `String(form.get("price")).replace(/\D/g, "")` se comía el
signo, así que `-10000` se publicaba como `10000`. Corregir en silencio lo que
alguien escribió es peor que rechazarlo: publica un precio que el vendedor nunca
puso.

El mismo error estaba en dos sitios más que no probaste: las ofertas del chat y,
en otra forma, los filtros de búsqueda. Ahora hay un único `parseCop` que devuelve
null en vez de arreglar, con pruebas unitarias que cubren el signo menos normal, el
tipográfico, decimales, notación científica y símbolos de moneda. Más una prueba de
punta a punta que comprueba que no queda ninguna fila.

## [ALTO] Esquema de autenticación — **no reproducible, pero señaló algo real**

El desajuste que viste venía de probar con el árbol sucio: yo tenía cambios sin
confirmar mientras corrías. El commit `3505bea` por sí solo es consistente.

Pero apuntaste a un problema real que sí existe: `db/auth-schema.sql` lo genera una
herramienta y **su salida depende del estado de la base**. Si la base ya tiene las
tablas, emite solo el `alter` en vez del esquema completo, y el archivo queda
truncado sin que nada avise. Me pasó exactamente eso construyendo S-10. Quedó
documentado en `CLAUDE.md` con el procedimiento correcto: vaciar el esquema público
antes de regenerar.

La raíz sigue siendo que no hay migraciones. Está en `NOTES.md` como pendiente
antes del primer usuario real.

## [DUDA] Batería paralela inestable — **causa encontrada, cerrada**

Tenías razón en no usarla como conteo de defectos. La causa: Next compila cada ruta
la primera vez que alguien la pide, y con las pruebas en paralelo la primera que
tocaba una ruta sin compilar pagaba esa compilación dentro de su presupuesto de
tiempo. Por eso empeoraba a medida que crecía el proyecto.

Ahora las rutas se precompilan antes de empezar (`e2e/global-setup.ts`). Tres
corridas seguidas estables, 119 pruebas.

## Para la próxima ronda

Dos peticiones concretas.

**Congela el árbol antes de empezar.** `git stash` o pídeme un commit. La mitad del
ruido de este informe viene de que el código cambiaba mientras probabas, y eso te
costó tiempo a ti y me cuesta a mí distinguir tus hallazgos del movimiento.

**Lo que quedó sin verificar y más falta hace:** la pasada de escritorio a 1280, el
zoom al 200%, los títulos y alias larguísimos, y la cola de moderación completa de
S-10, que ya está confirmada. El modo oscuro también.
