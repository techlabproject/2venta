"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, phoneNumberClient } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [
    // Hace que los campos propios del usuario (alias, zone) existan también para
    // el cliente, con los mismos tipos que declara el servidor.
    inferAdditionalFields<typeof auth>(),
    phoneNumberClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
