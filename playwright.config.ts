import { defineConfig } from "@playwright/test";

// Con E2E_BASE_URL la suite apunta a un servidor ya levantado, por ejemplo la
// imagen de Docker en el 3200 (`docker compose --profile imagen up`). Sin ella,
// arranca el servidor de desarrollo como siempre.
const external = process.env.E2E_BASE_URL;
export const baseURL = external ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./e2e",
  // La prueba de humo contra la nube tiene su propia configuración.
  testIgnore: /nube\.spec\.ts/,
  // Compila las rutas antes de empezar: ver e2e/global-setup.ts.
  globalSetup: "./e2e/global-setup.ts",
  // Las pruebas de compra y envío abren varios contextos de navegador y graban
  // video en cada uno. Treinta segundos les queda corto cuando corren en paralelo,
  // y el síntoma es un fallo intermitente que no dice nada.
  timeout: 60_000,
  // El runner de GitHub es unas cuatro veces más lento que el portátil: con los
  // mismos 5 s de espera por aserción, una de 239 falla por tiempo en cada
  // corrida. Más margen y un reintento allá; en el portátil, ninguno, para que
  // un intermitente se note.
  expect: { timeout: process.env.CI ? 15_000 : 5_000 },
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
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
  webServer: external
    ? undefined
    : {
        command: "next dev --port 3100",
        stdout: "ignore",
        url: "http://localhost:3100",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
