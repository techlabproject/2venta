import { defineConfig, devices } from "@playwright/test";

// Pruebas visuales (e2e/visual/). Cada pantalla importante se fotografía en
// móvil y en escritorio y se compara con la imagen de referencia confirmada en
// e2e/visual/pantallas.spec.ts-snapshots/. Un cambio visual, querido o no,
// hace fallar la prueba y muestra la diferencia.
//
// Los datos son los de la demostración (db/demo.mts), que son fijos; el
// arranque siembra la base y la carga. Por eso NO forma parte de `npm run
// verify`: dura más y necesita la base limpia. Se corre con `npm run test:visual`.
//
// Las referencias se generan en este portátil (sufijo -darwin). El runner de
// GitHub es Linux y dibuja las fuentes distinto; por eso hoy no corre allá.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./e2e/visual",
  globalSetup: "./e2e/visual/global-setup.ts",
  timeout: 120_000,
  retries: 0,
  workers: 1,
  fullyParallel: false,
  outputDir: "test-results/visual",
  expect: {
    toHaveScreenshot: {
      // Un 1 % de píxeles distintos: cubre el antialiasing y deja pasar poco más.
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    baseURL,
    colorScheme: "light",
    locale: "es-CO",
    timezoneId: "America/Bogota",
    permissions: ["camera", "microphone"],
    launchOptions: {
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
  },
  projects: [
    { name: "movil", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
    { name: "escritorio", use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "next dev --port 3100",
        stdout: "ignore",
        url: "http://localhost:3100",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
