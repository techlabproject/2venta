// En qué entorno corre la aplicación, dicho de forma explícita.
//
// `NODE_ENV` lo fija la compilación: toda imagen construida con `next build` corre
// en "production", aunque se despliegue en el entorno de desarrollo de la nube. Con
// eso, en `dev` no existirían los proveedores de prueba ni los puentes `/api/dev/*`,
// y no se podría probar una compra completa sin el proveedor de pagos real.
//
// `APP_ENV` responde otra pregunta: qué proveedores son reales y qué puentes
// existen. Este archivo no importa nada del servidor a propósito: lo leen tanto el
// cliente como el servidor.

export const APP_ENVS = ["desarrollo", "produccion"] as const;
export type AppEnv = (typeof APP_ENVS)[number];

/**
 * Si `APP_ENV` falta, se deduce de cómo se compiló: bajo `next build` se asume
 * producción. El error seguro es el que apaga los puentes de prueba, no el que
 * los deja abiertos.
 */
export function appEnv(env: Record<string, string | undefined> = process.env): AppEnv {
  const declared = env.APP_ENV;
  if (declared === undefined || declared === "") {
    return env.NODE_ENV === "production" ? "produccion" : "desarrollo";
  }
  if (!(APP_ENVS as readonly string[]).includes(declared)) {
    throw new Error(
      `APP_ENV vale "${declared}" y solo admite ${APP_ENVS.map((e) => `"${e}"`).join(" o ")}.`
    );
  }
  return declared as AppEnv;
}

export function isProduction(env?: Record<string, string | undefined>): boolean {
  return appEnv(env) === "produccion";
}
