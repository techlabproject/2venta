import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La imagen de Docker lleva solo lo que hace falta para correr, no node_modules
  // entero. Ver Dockerfile y slices/26-empaquetado.md.
  output: "standalone",
};

export default nextConfig;
