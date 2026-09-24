import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { pool } from "./db";
import { isProduction } from "./env";
import { CELULAR_GUARDADO } from "./celular";
import { VERSION_TERMINOS } from "@/features/legal/version";
import { edadCumplida, hoyEnBogota, problemaDeNacimiento } from "./edad";

// La autenticación se delega en una biblioteca establecida a propósito: el manejo
// de contraseñas, tokens y sesiones es exactamente lo que no se implementa a mano
// (ver references/zonas-sensibles.md de la skill product-build-loop).
export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  // La comprobación de origen es lo que impide que otro sitio dispare peticiones
  // autenticadas en nombre del usuario. En desarrollo el puerto cambia (Docker
  // ocupa el 3000, las pruebas usan otro), así que se confía en localhost en
  // cualquier puerto. En producción solo vale el dominio real: si esta lista
  // quedara abierta allí, la protección desaparece.
  trustedOrigins:
    isProduction()
      ? [process.env.BETTER_AUTH_URL!]
      : ["http://localhost:*", "http://127.0.0.1:*"],

  // Sin límite de intentos, el endpoint que manda códigos por SMS es una factura
  // abierta: cualquiera puede pedir miles de mensajes. El límite vive en la base de
  // datos y no en memoria, para que sobreviva a un reinicio y funcione con varias
  // instancias del servidor.
  rateLimit: {
    // En desarrollo se apaga el techo por dirección IP: la suite de pruebas corre
    // decenas de registros seguidos desde la misma máquina y los bloquearía. El
    // límite que de verdad protege cada cuenta es el de por número, que sí se
    // prueba y sí corre en desarrollo.
    enabled: isProduction(),
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      // Techo por dirección IP, solo contra inundación. El límite que de verdad
      // protege cada cuenta es por número de celular y vive en sendCode.
      "/sign-in/email": { window: 600, max: 10 },
    },
  },

  // Entrar con Google (D-01). Las credenciales salen de la consola de Google Cloud;
  // sin ellas el proveedor simplemente no se registra y el botón no aparece, en vez
  // de romper el arranque.
  socialProviders: googleConfigured()
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : undefined,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },

  user: {
    additionalFields: {
      // D-04: el alias es lo que ve el resto de la plataforma. El nombre real
      // nunca es público.
      // El celular y su estado de verificación los maneja S-17, no la biblioteca:
      // su complemento guardaba el código en texto plano (D-27).
      phoneNumber: { type: "string", required: false, input: true },
      phoneNumberVerified: { type: "boolean", required: false, input: false, defaultValue: false },
      alias: { type: "string", required: false, input: true },
      zone: { type: "string", required: false, input: true },
      // El rol NO es escribible desde el cliente: si lo fuera, cualquiera se
      // haría administrador al registrarse.
      role: { type: "string", required: false, input: false, defaultValue: "usuario" },
      // Se expone en la sesión para que activeUser() pueda comprobarlo sin una
      // consulta extra en cada acción.
      suspendedAt: { type: "date", required: false, input: false, fieldName: "suspended_at" },
      // Corrección 11: qué versión de los términos aceptó y cuándo. La versión la
      // manda el formulario y se comprueba abajo; la fecha la pone el servidor.
      termsVersion: { type: "string", required: false, input: true, fieldName: "terms_version" },
      termsAcceptedAt: { type: "date", required: false, input: false, fieldName: "terms_accepted_at" },
      // Corrección 11: AAAA-MM-DD; se comprueba en el hook y no se cambia después.
      birthDate: { type: "string", required: false, input: true, fieldName: "birth_date" },
    },
  },

  databaseHooks: {
    user: {
      create: {
        // La hora de aceptación no se le cree al cliente: la pone el servidor en el
        // mismo instante en que se crea la cuenta.
        before: async (user) => ({
          data: { ...user, termsAcceptedAt: user.termsVersion ? new Date() : null },
        }),
      },
    },
  },

  hooks: {
    // La biblioteca solo mide el largo de la contraseña, así que "        " (ocho
    // espacios) le parece válida. Se rechaza aquí, en el servidor, porque la
    // comprobación en la pantalla no es control de nada.
    before: createAuthMiddleware(async (ctx) => {
      // Una cuenta suspendida no vuelve a entrar. Sin esto, suspender solo cerraba
      // las sesiones abiertas y bastaba con volver a iniciar sesión.
      if (ctx.path === "/sign-in/email") {
        const email = ctx.body?.email;
        if (typeof email === "string") {
          const { query } = await import("./db");
          const rows = await query<{ suspended_at: Date | null }>(
            `select suspended_at from "user" where email = $1`,
            [email.trim().toLowerCase()]
          );
          if (rows[0]?.suspended_at) {
            throw new APIError("FORBIDDEN", {
              code: "ACCOUNT_SUSPENDED",
              message: "Esta cuenta está suspendida. Escríbenos si crees que es un error.",
            });
          }
        }
        return;
      }

      // El celular se comprueba aquí y no solo en la pantalla: el código SMS se
      // manda al número guardado, y sin esto una petición armada a mano guardaba
      // cualquier cosa y hacía mandar códigos a números de otro país o inventados
      // (corrección 7).
      if (ctx.path === "/sign-up/email" || ctx.path === "/update-user") {
        const celular = ctx.body?.phoneNumber;
        if (celular !== undefined && celular !== null && !CELULAR_GUARDADO.test(String(celular))) {
          throw new APIError("BAD_REQUEST", {
            code: "INVALID_PHONE",
            message: "Ese celular no es válido: son 10 dígitos que empiezan por 3.",
          });
        }
        // Corrección 13 (decisión de Nicolás): si el celular ya es de otra cuenta
        // confirmada, se dice al registrarse y no se crea nada. Antes se enteraba al
        // confirmar el código, con una cuenta a medias creada. Confirma que el número
        // existe, igual que ya lo hacía el correo; lo acota el límite de intentos.
        if (ctx.path === "/sign-up/email" && typeof celular === "string") {
          const { query } = await import("./db");
          const usado = await query(
            `select 1 from "user" where "phoneNumber" = $1 and "phoneNumberVerified"`,
            [celular],
          );
          if (usado.length) {
            throw new APIError("BAD_REQUEST", {
              code: "PHONE_TAKEN",
              message: "¡Uy! Ese celular ya tiene una cuenta. Inicia sesión o recupera tu contraseña.",
            });
          }
        }
      }

      // La versión aceptada se escribe una vez, al crear la cuenta. Cambiarla por
      // aquí reescribiría la prueba de consentimiento sin la fecha que la acompaña.
      if (ctx.path === "/update-user" && ctx.body?.termsVersion !== undefined) {
        throw new APIError("BAD_REQUEST", {
          code: "TERMS_READONLY",
          message: "La aceptación de los términos no se cambia desde aquí.",
        });
      }
      // La fecha de nacimiento es la prueba de mayoría de edad: tampoco se reescribe.
      if (ctx.path === "/update-user" && ctx.body?.birthDate !== undefined) {
        throw new APIError("BAD_REQUEST", {
          code: "BIRTHDATE_READONLY",
          message: "La fecha de nacimiento no se cambia desde aquí.",
        });
      }

      if (ctx.path !== "/sign-up/email") return;
      // Un nombre de solo espacios creaba una cuenta sin nombre (Luna, corrección 13).
      if (typeof ctx.body?.name !== "string" || !ctx.body.name.trim()) {
        throw new APIError("BAD_REQUEST", {
          code: "NAME_REQUIRED",
          message: "Escribe tu nombre.",
        });
      }
      // Sin aceptar la versión vigente de los términos no hay cuenta (corrección 11).
      // La casilla de la pantalla no es control de nada.
      if (ctx.body?.termsVersion !== VERSION_TERMINOS) {
        throw new APIError("BAD_REQUEST", {
          code: "TERMS_REQUIRED",
          message: "Lee y acepta los términos y la política de datos para crear tu cuenta.",
        });
      }
      // Art. 52 de la Ley 1480: no se crean cuentas de menores de 18 (corrección 11).
      const nacimiento = typeof ctx.body?.birthDate === "string" ? ctx.body.birthDate : "";
      const problemaEdad = problemaDeNacimiento(nacimiento);
      if (problemaEdad) {
        const edad = nacimiento ? edadCumplida(nacimiento, hoyEnBogota()) : null;
        throw new APIError("BAD_REQUEST", {
          code: !nacimiento
            ? "BIRTHDATE_REQUIRED"
            : edad === null || edad < 0 || edad > 120
              ? "INVALID_BIRTHDATE"
              : "UNDERAGE",
          message: problemaEdad,
        });
      }
      const password = ctx.body?.password;
      if (typeof password === "string" && password.trim().length < 8) {
        throw new APIError("BAD_REQUEST", {
          code: "PASSWORD_TOO_WEAK",
          message: "La contraseña necesita al menos ocho caracteres que no sean espacios.",
        });
      }
    }),
  },

  plugins: [
    // Debe ir de último: es lo que deja que la biblioteca escriba la cookie de
    // sesión desde una acción de servidor.
    nextCookies(),
  ],
});
