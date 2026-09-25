import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La imagen de Docker lleva solo lo que hace falta para correr, no node_modules
  // entero. Ver Dockerfile y slices/26-empaquetado.md.
  output: "standalone",
  // El indicador flotante de herramientas de Next en desarrollo tapa botones en
  // móvil y sale en las fotos de las pruebas visuales.
  devIndicators: false,
  // No anunciar el framework en cada respuesta.
  poweredByHeader: false,
  // El límite por defecto de una acción de servidor es 1 MB: la carga en lote
  // promete 2 MB y el RUT de una persona jurídica (corrección 15) también llega a 2.
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
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
          // La cámara y el micrófono los usa la propia app para grabar el video; la
          // ubicación, «Usar mi ubicación» (D-122). Solo el propio sitio, nunca un
          // tercero incrustado.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
