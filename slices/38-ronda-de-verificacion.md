# S-38 — Ronda de verificación con agentes, y el botón de volver

**Fecha:** 2026-09-20

## Qué se pidió

Dos cosas en el mismo mensaje. Una de diseño: el botón de devolverse se veía plano en
todas las pantallas. Y una de calidad: comprobar que **todos los flujos y todos los
botones hacen de verdad lo que dicen**, con una agente (Luna) usando la aplicación en
el navegador y otra (Sol) evaluando si se entiende.

## Cómo se hizo

Tres pasadas independientes, porque cada una ve lo que las otras no:

| Quién | Con qué | Qué encontró |
|---|---|---|
| Codex (`codex exec`, esfuerzo alto) | Lee el código, elemento por elemento | Los 6 defectos de permisos y flujo |
| Sol (esfuerzo medio) | Las 72 capturas visuales, como usuaria | Los 3 de comprensión y jerarquía |
| Luna (esfuerzo máximo) | La aplicación corriendo, en el navegador | Los 3 de datos incoherentes en pantalla |

Los informes quedan en `qa/informe-2026-09-20.md` y `qa/ronda-diseno/sol-2026-09-20.md`.

## Qué cambió

- `src/components/Volver.tsx` nuevo, aplicado en las 16 pantallas que tenían el
  enlace subrayado (D-93).
- La cabecera deja de competir con la acción principal (D-94) y las pantallas de
  entrada llevan marca y salida (D-95).
- Nueve defectos arreglados, cada uno con la prueba que lo reproduce (D-96).

## Fuera de alcance

- **Adjuntar fotos a un reclamo** (H-4 de Luna). Es razonable —el chat ya las
  acepta y una disputa por «llegó dañado» las necesita— pero es una función nueva,
  no un defecto. Queda pendiente y decidido a propósito.
- Lo que Luna no pudo verificar está listado al final de su informe: publicar un
  artículo, recuperar contraseña, el cierre de recibir → liberar → calificar, y la
  navegación completa por teclado. No son fallos observados; son huecos honestos.

## Cómo se demuestra

`E2E_BASE_URL=http://localhost:3200 npx playwright test --workers=3` → **297 de 297**.
Tipos limpios, linter sin errores, 125 unitarias, 52 comparaciones visuales sobre
72 referencias regeneradas.
