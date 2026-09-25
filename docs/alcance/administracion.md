> **Fila 48 decidida 2026-09-25 (D-127):** opción A, la cuenta del equipo solo
> administra. La fila 52 (qué se gestiona desde el panel) sigue por decidir.

# El administrador y el panel de administración

Correcciones 48 y 52 de Catalina:
- 48: «Siendo admin, el botón "Vender" le permitiría registrarse para vender. ¿Debería
  mostrarse o el panel debería estar enfocado en administrar?»
- 52: «No sé cómo se pueden cambiar etiquetas o filtros. Crear un panel administrativo
  para gestionar todas las etiquetas y detalles de la página, con una dirección
  privada.»

## Cómo está hoy

- El admin es una cuenta normal con `role = 'admin'`. Ve todo lo de cualquier persona
  (puede comprar y vender) y además `/admin`: moderación de publicaciones en
  revisión, reportes de publicaciones y de cuentas, conversaciones reportadas,
  disputas, empresas por confirmar (NIT) y reportes de negocio.
- `/admin` ya es privado: para quien no es admin responde 404, y el control está en
  el servidor.
- **Las categorías, las zonas, los motivos de reporte, los precios mínimos, las tallas
  y edades, y los textos** están en la base o en el código; cambiarlos requiere un
  desarrollador.

## Fila 48: el admin y «Vender»

| Opción | Qué |
|---|---|
| **A. Cuentas de equipo separadas (recomendada)** | La cuenta admin no compra ni vende: sin «Vender», carrito ni chats de compra; su menú lleva a `/admin`. Quien del equipo quiera vender usa su cuenta personal. Evita conflictos de interés (un moderador que modera sus propias ventas) |
| B. Dejarlo como está | El admin puede vender como cualquiera |

## Fila 52: panel de administración

Qué se podría gestionar sin desarrollador, de más útil a menos:
1. **Categorías:** nombre, orden, activa o no (ya están en la base: tabla `categories`).
2. **Zonas / localidades y lugares de encuentro** (ver ubicación y fila 46).
3. **Tallas y rangos de edad** (hoy en `src/features/catalog/atributos.ts`).
4. **Palabras prohibidas** del filtro de moderación.
5. **Textos de la portada** y avisos generales.

**Recomendación:** empezar por 1 y 2 en `/admin/configuracion`, con registro de quién
cambió qué (auditoría). Los textos, después: cambiarlos sin revisión puede romper el
tono y lo legal.

## Preguntas para Nicolás

1. ¿Opción A en la fila 48?
2. ¿Qué se puede gestionar primero en el panel?
