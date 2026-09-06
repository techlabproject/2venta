import { NextResponse } from "next/server";
import { contentTypeOf, read } from "@/lib/storage";

// Sirve los archivos subidos. Mientras el almacenamiento sea disco local esto lo
// hace la aplicación; con un servicio real se sirven directamente desde allá.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const relative = path.join("/");
  const bytes = await read(relative);
  if (!bytes) return new NextResponse("No encontrado", { status: 404 });

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "content-type": contentTypeOf(relative),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
