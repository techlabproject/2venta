// Dirección pública de un archivo guardado. Se resuelve en tiempo de ejecución,
// no en la compilación: la misma imagen sirve para `dev` y `prod`, y cada entorno
// tiene su propia MEDIA_BASE_URL (CloudFront en AWS, MinIO en el portátil).
//
// Solo lo usan componentes de servidor. En el cliente no hay forma de leerlo sin
// hornearlo en la imagen.
export function mediaUrl(key: string): string {
  return `${process.env.MEDIA_BASE_URL!.replace(/\/$/, "")}/${key}`;
}
