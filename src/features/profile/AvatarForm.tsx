"use client";

import { useRef, useState, useTransition } from "react";
import { removeAvatar, saveAvatar } from "./actions";
import { uploadBlob, UploadError } from "@/features/publish/useUpload";
import { Button, ErrorNote } from "@/components/ui";

// La foto va directo al bucket desde el navegador (D-50) y al servidor solo le
// llega la clave, que él comprueba contra S3 antes de guardarla.

export function AvatarForm({ tieneFoto }: { tieneFoto: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [quitando, quitar] = useTransition();

  async function elegida(file: File | undefined) {
    if (!file) return;
    setError(null);
    setSubiendo(true);
    try {
      const key = await uploadBlob(file, "avatar");
      const form = new FormData();
      form.set("avatar", key);
      const result = await saveAvatar(null, form);
      if (result.error) setError(result.error);
    } catch (e) {
      setError(
        e instanceof UploadError
          ? e.message
          : "No pudimos subir la foto. Revisa la conexión e intenta otra vez.",
      );
    } finally {
      setSubiendo(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <ErrorNote>{error}</ErrorNote>}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png"
        className="sr-only"
        id="foto-de-perfil"
        onChange={(e) => elegida(e.target.files?.[0])}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-auto"
          disabled={subiendo}
          onClick={() => input.current?.click()}
        >
          {subiendo
            ? "Subiendo…"
            : tieneFoto
              ? "Cambiar la foto"
              : "Subir una foto"}
        </Button>

        {tieneFoto && (
          <Button
            type="button"
            variant="ghost"
            className="w-auto"
            disabled={quitando}
            onClick={() =>
              quitar(async () => {
                // `void removeAvatar()` descartaba la promesa: si la acción
                // fallaba, la foto seguía ahí y nadie decía nada.
                try {
                  await removeAvatar();
                } catch {
                  setError("No pudimos quitar la foto. Intenta de nuevo.");
                }
              })
            }
          >
            {quitando ? "Quitando…" : "Quitar"}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted">
        JPG o PNG, hasta 8 MB. Se ve en tu perfil y al lado de cada cosa que
        publiques; tu nombre completo sigue sin ser público.
      </p>
    </div>
  );
}
