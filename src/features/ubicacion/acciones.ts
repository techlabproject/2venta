"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isProduction } from "@/lib/env";
import { destinoInterno } from "@/lib/destino";
import { COOKIE_UBICACION, escribirPunto, type PuntoDelComprador } from "./comprador";
import { aCuadricula, dentroDelArea, FUERA_DEL_AREA, zonaReconocida } from "./zonas";

export type ResultadoUbicacion = { error: string };

/**
 * Guarda dónde está quien mira (D-122): la zona elegida de la lista (sirve sin
 * JavaScript) o el punto del celular, ya redondeado. Solo en su cookie.
 */
export async function fijarUbicacion(form: FormData): Promise<ResultadoUbicacion> {
  const volver = destinoInterno(String(form.get("volver") ?? "")) ?? "/";
  let punto: PuntoDelComprador;

  const latTexto = String(form.get("lat") ?? "");
  const lngTexto = String(form.get("lng") ?? "");
  if (latTexto && lngTexto) {
    const lat = Number(latTexto);
    const lng = Number(lngTexto);
    if (!dentroDelArea(lat, lng)) return { error: FUERA_DEL_AREA };
    punto = { lat: aCuadricula(lat), lng: aCuadricula(lng), origen: "dispositivo" };
  } else {
    const zona = zonaReconocida(String(form.get("zona") ?? ""));
    if (!zona) return { error: "Elige tu zona de la lista." };
    punto = { lat: aCuadricula(zona.lat), lng: aCuadricula(zona.lng), origen: zona.nombre };
  }

  (await cookies()).set(COOKIE_UBICACION, escribirPunto(punto), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(volver);
}

/**
 * La del formulario de la barra (zona de la lista y «Listo»), que funciona sin
 * JavaScript. Un valor manipulado no guarda nada y vuelve a donde estaba.
 */
export async function fijarZona(form: FormData): Promise<void> {
  await fijarUbicacion(form);
  redirect(destinoInterno(String(form.get("volver") ?? "")) ?? "/");
}

export async function quitarUbicacion(form: FormData): Promise<void> {
  (await cookies()).delete(COOKIE_UBICACION);
  redirect(destinoInterno(String(form.get("volver") ?? "")) ?? "/");
}
