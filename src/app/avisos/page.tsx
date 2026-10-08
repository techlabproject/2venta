import { permanentRedirect } from "next/navigation";

// «Avisos» pasó a llamarse «Notificaciones» (fila 78, D-131). Los enlaces viejos
// —correos, marcadores, la cabecera de una versión anterior— siguen sirviendo.
export default function Avisos() {
  permanentRedirect("/notificaciones");
}
