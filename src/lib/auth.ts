import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { phoneNumber } from "better-auth/plugins";
import { pool } from "./db";
import { sendVerificationCode } from "./sms";
import { assertCanSendCode } from "./otp-rate-limit";

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
    process.env.NODE_ENV === "production"
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
    enabled: process.env.NODE_ENV === "production",
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      // Techo por dirección IP, solo contra inundación. El límite que de verdad
      // protege cada cuenta es por número de celular y vive en sendOTP.
      "/phone-number/send-otp": { window: 3600, max: 40 },
      "/phone-number/verify": { window: 600, max: 10 },
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
      alias: { type: "string", required: false, input: true },
      zone: { type: "string", required: false, input: true },
    },
  },

  hooks: {
    // La biblioteca solo mide el largo de la contraseña, así que "        " (ocho
    // espacios) le parece válida. Se rechaza aquí, en el servidor, porque la
    // comprobación en la pantalla no es control de nada.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
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
    phoneNumber({
      // D-01: sin número verificado no se compra ni se escribe.
      sendOTP: async ({ phoneNumber, code }) => {
        await assertCanSendCode(phoneNumber);
        await sendVerificationCode(phoneNumber, code);
      },
      otpLength: 6,
      expiresIn: 300, // cinco minutos
      allowedAttempts: 5,
      // A propósito NO se activa signUpOnVerification. Crearía una segunda vía de
      // registro, solo con celular y sin contraseña, que contradice la D-01 y
      // deja que pedir un código a un número cualquiera cree una cuenta.
    }),
    // Debe ir de último: es lo que deja que la biblioteca escriba la cookie de
    // sesión desde una acción de servidor.
    nextCookies(),
  ],
});
