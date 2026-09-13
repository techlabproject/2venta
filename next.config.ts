import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La imagen de Docker lleva solo lo que hace falta para correr, no node_modules
  // entero. Ver Dockerfile y slices/26-empaquetado.md.
  output: "standalone",
  // No anunciar el framework en cada respuesta.
  poweredByHeader: false,
  // Cabeceras de defensa en profundidad (hallazgo de QA, 2026-09-13). Sin CSP
  // todavía: Next inyecta scripts en línea y una CSP mal puesta rompe la app;
  // entra cuando se pueda probar con nonces.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // La cámara y el micrófono los usa la propia app para grabar el video.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
