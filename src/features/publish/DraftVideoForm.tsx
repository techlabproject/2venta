"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { publishDraft, type PublishResult } from "./actions";
import { uploadBlob, UploadError } from "./useUpload";
import { VideoCapture } from "./VideoCapture";
import { Button, ErrorNote } from "@/components/ui";

export function DraftVideoForm({ draftId }: { draftId: string }) {
  const router = useRouter();
  const [media, setMedia] = useState<{ video: Blob; poster: Blob } | null>(
    null,
  );

  const [uploading, setUploading] = useState(false);

  const [result, submit, pending] = useActionState<
    PublishResult | null,
    FormData
  >(async (prev, form) => {
    // D-50: directo al bucket; a la acción llegan solo las claves.
    if (media) {
      setUploading(true);
      try {
        const [videoKey, posterKey] = await Promise.all([
          uploadBlob(media.video, "video"),
          uploadBlob(media.poster, "image"),
        ]);
        form.set("video_key", videoKey);
        form.set("poster_key", posterKey);
      } catch (err) {
        if (err instanceof UploadError) return { error: err.message };
        throw err;
      } finally {
        setUploading(false);
      }
    }
    const res = await publishDraft(prev, form);
    if ("id" in res) {
      // Fila 69 (D-129): `replace` y no `push`, para que el atrás del navegador no
      // regrese al formulario lleno; la ficha llega sin «Volver».
      router.replace(`/producto/${res.id}?recien=publicado`);
      router.refresh();
    }
    return res;
  }, null);

  return (
    <form action={submit} className="mt-5 flex flex-col gap-4">
      {result && "error" in result && <ErrorNote>{result.error}</ErrorNote>}
      <input type="hidden" name="draftId" value={draftId} />
      <VideoCapture
        onCaptured={(video, poster) => setMedia({ video, poster })}
          onDescartado={() => setMedia(null)}
      />
      <Button type="submit" disabled={pending || !media}>
        {uploading
          ? "Subiendo…"
          : pending
            ? "Publicando…"
            : media
              ? "Publicar"
              : "Graba el video para continuar"}
      </Button>
    </form>
  );
}
