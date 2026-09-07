# Carpeta de control de calidad

Aquí deja Luna, la verificadora independiente, sus informes. El prompt que la
gobierna está en `../AGENTE-QA.md`.

- `informe-AAAA-MM-DD.md` — un informe por ronda
- `capturas/` — imágenes, nombradas por lo que muestran
- `salidas/` — salidas crudas de comandos, una por archivo

El agente de desarrollo lee esta carpeta al empezar cada sesión. Si hay un informe
nuevo, lo primero es cerrar sus hallazgos antes de construir nada más.
