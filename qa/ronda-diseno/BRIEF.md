# Ronda de evaluación de diseño y flujos — 2026-09-13

Nicolás, el dueño del producto, dice esto después de usar la aplicación:

> «El diseño actual es demasiado plano, no tiene personalidad, y en sí hace que la
> página sea muy monótona y aburrida.»

Y encontró dos cosas rotas:

1. Entró como comprador, quiso escribirle a un vendedor, y desde el **perfil del
   vendedor** no encontró el chat.
2. Como vendedor, **no puede ver sus propios productos**.

Esta ronda existe para atacar eso con ojos frescos.

## Qué es 2venta

Un marketplace de segunda mano para Bogotá, en tres categorías: tecnología, ropa
y niños. Su promesa es la **confianza**, sostenida en cinco cosas: celular
verificado, identidad del vendedor verificada, **video obligatorio grabado dentro
de la app** (no se sube de galería), **pago retenido** hasta que el comprador
confirma, y conversación que no se sale de la app.

El diferenciador frente a Marketplace de Facebook o Mercado Libre es que aquí no
te estafan: por eso el video y el pago protegido son el corazón del producto.

## Dónde mirar

**Entorno en vivo:** `https://d13g2bd9j8wj8k.cloudfront.net`
Está cargado con datos de demostración: doce productos con fotos y video reales.

**Cuentas de prueba**, contraseña `Demo2venta.2026`:

| Correo | Rol |
|---|---|
| `laura@2venta.demo` | Compradora |
| `camila@2venta.demo` | Vendedora verificada, con tienda |
| `andres@2venta.demo` | Vendedor verificado |
| `admin@2venta.demo` | Administración |

**Capturas ya tomadas de las 35 pantallas**, en móvil y escritorio:
`e2e/visual/pantallas.spec.ts-snapshots/*.png`. Los nombres terminan en
`-movil-darwin.png` y `-escritorio-darwin.png`. Puedes abrirlas con la
herramienta Read, que te las muestra. **Empieza por ahí**: es la forma más rápida
de ver todo el producto de una sentada.

## Reglas

- Trabaja desde `/Users/nicolasr2/Downloads/2venta`.
- **No modifiques código del producto** (`src/`, `db/`, `infra/`). Reportas, no
  reparas. La excepción es tu propio archivo de exploración si escribes pruebas.
- No corras `npm run verify`, `npm run test:visual`, `docker compose` ni
  `terraform`.
- Si escribes pruebas de Playwright, ponlas en `e2e/qa/<tu-nombre>/` y córrelas
  con `QA_BASE_URL=https://d13g2bd9j8wj8k.cloudfront.net npx playwright test
  --config playwright.qa.config.ts e2e/qa/<tu-nombre>/`. **Córrelas siempre en
  primer plano**, nunca en segundo plano, nunca esperes notificaciones.
- Todo lo que escribas va en español de Colombia.
- Tu informe va en `qa/ronda-diseno/informe-<tu-nombre>.md`.

## Qué NO reportar

Lee `DECISIONS.md` y `slices/` antes de dar algo por defecto. Muchas cosas son
decisiones tomadas a propósito y documentadas:

- No hay modo oscuro. No hay dominio propio (la dirección es de CloudFront).
- Los proveedores de pagos, identidad, SMS y transportadora son de prueba: los
  botones «Simular pago aprobado» existen solo en desarrollo.
- Un vendedor sin ventas no muestra cifras en cero (D-17), a propósito.
- El filtro que oculta teléfonos en el chat no pretende ser infalible (D-22).
- Las alertas se generan pero no se envían por correo: no hay proveedor todavía.

## Cómo se escribe un hallazgo

Con gravedad, qué esperabas, qué pasó, cómo reproducirlo y evidencia (captura o
salida). Gravedades: **CRÍTICO** · **ALTO** · **MEDIO** · **BAJO** · **DUDA**.

Y lo más importante para esta ronda: **propón la solución concreta**. No basta
«se ve plano»: di qué harías, en qué pantalla, y por qué eso mejora la confianza
o la conversión. Si propones un cambio visual, descríbelo con suficiente detalle
para que alguien lo pueda implementar sin adivinar.

---

## Actualización del 2026-09-13, 17:40

Antes de que empezaras ya se corrigieron estas cosas (no las reportes como
nuevas; **sí verifica que quedaron bien**):

- `/vender` de un vendedor verificado es ahora un panel con «Publicar un
  artículo», «Mis publicaciones» y «Mis ventas y conversaciones». Antes era un
  callejón sin salida.
- La cabecera tiene un botón **Vender** para quien tiene sesión.
- El perfil del vendedor explica que se le escribe desde el artículo.
- El feed pasa de 2 a 4 columnas en escritorio y las tarjetas anuncian «Con video».
- La portada abre con una franja verde con la promesa del producto.
- La ficha es de dos columnas en escritorio, con el video primero.
- El chat encabeza con la foto del artículo y dice con quién hablas.

Tu trabajo es lo que **queda**.
