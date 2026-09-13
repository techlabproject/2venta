import { defineConfig } from "@playwright/test";

// Configuración para la prueba de humo contra un entorno desplegado
// (e2e/nube.spec.ts). Sin servidor local, sin precompilación, una sola prueba.
export default defineConfig({
  testDir: "./e2e",
  testMatch: /nube\.spec\.ts/,
  timeout: 240_000,
  retries: 0,
  workers: 1,
  use: {
    permissions: ["camera", "microphone"],
    launchOptions: {
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
  },
});
