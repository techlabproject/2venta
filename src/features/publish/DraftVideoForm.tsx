"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { publishDraft, type PublishResult } from "./actions";
import { VideoCapture } from "./VideoCapture";
import { Button, ErrorNote } from "@/components/ui";

const EXTENSION: Record<string, string> = {
  "video/webm": "webm",
  "video/mp4": "mp4",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function asFile(blob: Blob, base: string): File {
  const type = blob.type.split(";")[0];
  return new File([blob], `${base}.${EXTENSION[type] ?? "bin"}`, { type });
}

export function DraftVideoForm({ draftId }: { draftId: string }) {
  const router = useRouter();
  const [media, setMedia] = useState<{ video: Blob; poster: Blob } | null>(null);

  const [result, submit, pending] = useActionState<PublishResult | null, FormData>(
    async (prev, form) => {
      if (media) {
        form.set("video", asFile(media.video, "video"));
        form.set("poster", asFile(media.poster, "poster"));
      }
      const res = await publishDraft(prev, form);
      if ("id" in res) {
        router.push(`/producto/${res.id}`);
        router.refresh();
      }
      return res;
    },
    null
  );

  return (
    <form action={submit} className="mt-5 flex flex-col gap-4">
      {result && "error" in result && <ErrorNote>{result.error}</ErrorNote>}
      <input type="hidden" name="draftId" value={draftId} />
      <VideoCapture onCaptured={(video, poster) => setMedia({ video, poster })} />
      <Button type="submit" disabled={pending || !media}>
        {pending ? "Publicando…" : media ? "Publicar" : "Graba el video para continuar"}
      </Button>
    </form>
  );
}
