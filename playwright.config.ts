import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Las pruebas de compra y envío abren varios contextos de navegador y graban
  // video en cada uno. Treinta segundos les queda corto cuando corren en paralelo,
  // y el síntoma es un fallo intermitente que no dice nada.
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3100",
    // Cámara y micrófono simulados: es lo que permite probar de verdad el video
    // obligatorio de la D-14, que es el diferenciador del producto.
    permissions: ["camera", "microphone"],
    launchOptions: {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
    },
  },
  webServer: {
    command: "next dev --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
