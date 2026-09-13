import { execFileSync } from "node:child_process";
import type { FullConfig } from "@playwright/test";

// Espera a que el servidor responda. La base la deja lista cada proyecto por su
// cuenta (ver el beforeAll de pantallas.spec.ts): móvil y escritorio compran y
// reservan cosas, y el segundo no puede heredar lo que hizo el primero.
export default async function globalSetup(config: FullConfig) {
  const baseURL = String(config.projects[0].use.baseURL);

  // El servidor puede estar levantando todavía.
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseURL}/api/salud`);
      if (res.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
}

/** Base vacía, migrada, sembrada y con la demostración cargada. */
export function resetDemo(baseURL: string) {
  execFileSync("npx", ["tsx", "db/seed.ts"], { stdio: "inherit" });
  execFileSync("node", ["--env-file=.env.local", "--import", "tsx", "db/demo.mts"], {
    stdio: "inherit",
    env: { ...process.env, BETTER_AUTH_URL: baseURL },
  });
}
