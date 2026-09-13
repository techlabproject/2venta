// Prepara los archivos de demostración: fotos, portadas y videos cortos.
//
// Se corre UNA vez en el portátil (necesita red y ffmpeg) y sus salidas se
// confirman en db/demo/media/. El script que carga la demo (db/demo.mts) solo
// lee esa carpeta; nunca descarga nada, ni en la nube.
//
// Las fotos son de Unsplash vía picsum.photos, por id fijo (licencia Unsplash:
// libres para cualquier uso). Autorizado por Nicolás el 2026-09-13.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { ARTICULOS } from "./articulos";

const OUT = new URL("./media/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

async function fetchPhoto(id: number): Promise<Buffer> {
  const res = await fetch(`https://picsum.photos/id/${id}/1200/900.jpg`, { redirect: "follow" });
  if (!res.ok) throw new Error(`picsum ${id}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

for (const a of ARTICULOS) {
  const base = await fetchPhoto(a.foto);
  // Tres "fotos" a partir de la misma: completa, un acercamiento y otro encuadre.
  // Un vendedor real sube varias tomas del mismo objeto; esto se le parece.
  const tomas = [
    sharp(base).resize(960, 720, { fit: "cover" }),
    sharp(base).extract({ left: 200, top: 150, width: 800, height: 600 }).resize(960, 720),
    sharp(base).extract({ left: 0, top: 300, width: 900, height: 600 }).resize(960, 720),
  ];
  for (const [i, t] of tomas.entries()) {
    writeFileSync(`${OUT}${a.slug}-${i + 1}.jpg`, await t.jpeg({ quality: 78 }).toBuffer());
  }
  writeFileSync(
    `${OUT}${a.slug}-portada.jpg`,
    await sharp(base).resize(640, 480, { fit: "cover" }).jpeg({ quality: 75 }).toBuffer()
  );
  // Un video de cinco segundos con un acercamiento lento sobre la foto. No es
  // el objeto girando, pero se ve y pesa poco.
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-loop", "1", "-i", `${OUT}${a.slug}-1.jpg`,
    "-vf", "zoompan=z='min(zoom+0.0015,1.25)':d=125:s=640x480:fps=25,format=yuv420p",
    "-t", "5", "-c:v", "libx264", "-crf", "30", "-preset", "veryfast", "-movflags", "+faststart",
    `${OUT}${a.slug}.mp4`,
  ]);
  console.log(`listo ${a.slug}`);
}
