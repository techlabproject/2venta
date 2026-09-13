import { defineConfig } from "@playwright/test";

// Configuración para las pasadas de verificación independiente (qa/). Los
// agentes escriben sus exploraciones en e2e/qa/<agente>/ y las corren contra un
// servidor ya levantado (QA_BASE_URL), con captura y video de todo lo que falle.
// Estas pruebas NO forman parte de `npm run verify`: son exploratorias.
const baseURL = process.env.QA_BASE_URL ?? "http://localhost:3200";

export default defineConfig({
  testDir: "./e2e/qa",
  timeout: 120_000,
  retries: 0,
  workers: 2,
  reporter: [["list"]],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    permissions: ["camera", "microphone"],
    launchOptions: {
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
  },
  outputDir: "qa/salidas/playwright",
});
