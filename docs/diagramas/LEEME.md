# Diagramas de ingeniería

Generados el 2026-09-18 contra el estado real del repositorio y de la cuenta AWS
`681842289811` (`us-east-1`). Cada documento abre con la tabla de evidencia —
archivo o comando— que sustenta cada componente que dibuja.

| # | Diagrama | Fuente |
|---|---|---|
| 1 | [Arquitectura general](01-arquitectura-general.md) | CLI de AWS + `src/app` |
| 2 | [Integración con AWS](02-integracion-aws.md) | CLI de AWS (nombres reales) |
| 3 | [Modelo de datos](03-modelo-de-datos.md) | `information_schema` + migraciones |
| 4 | [Módulos del backend](04-modulos-del-backend.md) | estructura de `src/` |

Las imágenes están en `img/`, en SVG (escalable, para documentos) y PNG (×2, para
presentaciones).

## Cómo regenerarlos

Los `.md` llevan el diagrama como bloque ```mermaid, así que **el documento es la
fuente** y las imágenes son el resultado. Para volver a exportarlas tras un cambio:

```bash
npx -y @mermaid-js/mermaid-cli@11 -i entrada.mmd -o salida.svg \
  -c docs/diagramas/img/tema.json -b "#F2F5F3"
```

`img/tema.json` lleva la paleta del producto («petróleo y coral», D-84), para que
los diagramas no parezcan de otro proyecto.

## Lo que estos diagramas NO afirman

- El esquema de **RDS no se pudo consultar** (`PubliclyAccessible: false`). El
  diagrama 3 sale de la base local con las mismas migraciones, y marca la
  diferencia conocida: la `0013` no está desplegada.
- **Amplify no se usa** (`list-apps` vacío) y **App Runner no está disponible** en
  esta cuenta (`SubscriptionRequiredException`). No aparecen porque no existen.
- **MediaConvert tampoco está disponible**, aunque su rol y sus permisos sí están
  aprovisionados.
- Las dependencias del diagrama 4 salen de contar importaciones estáticas, no de
  analizar el AST.
