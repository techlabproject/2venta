# 2venta

Marketplace de segunda mano para Colombia. Bogotá, tres categorías, pago protegido:
el dinero queda retenido hasta que el comprador recibe lo que vio en video.

## Cómo se organiza el proyecto

| Archivo | Qué es |
|---|---|
| `SPEC.md` | El producto: problema, alcance, criterios de aceptación |
| `ARQUITECTURA.md` | Monolito modular en contenedor sobre AWS, y por qué |
| `DECISIONS.md` | Cada decisión con su fecha y su porqué |
| `slices/` | Una especificación por rebanada construida |
| `NOTES.md` | Estado actual y lo que queda a medias |
| `CLAUDE.md` | Comandos, convenciones y rarezas del entorno |

## Correr en el portátil

```bash
docker compose up -d        # Postgres en el puerto 5433
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Las variables de entorno van en `.env.local`; al arrancar, la aplicación dice
cuáles faltan y para qué sirve cada una.

## Verificar

```bash
npm run verify
```

Tipos, linter, pruebas unitarias, siembra y las pruebas de navegador de punta a
punta. Para correr la suite contra la imagen de Docker, ver `CLAUDE.md`.
