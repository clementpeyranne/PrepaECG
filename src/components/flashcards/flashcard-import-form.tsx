"use client";

import { useRef, useState, type ReactNode } from "react";

import { MAX_FLASHCARD_ARCHIVE_BYTES } from "@/lib/upload-rules";

export function FlashcardImportForm({
  action,
  cloud,
  children
}: {
  action: (formData: FormData) => Promise<void>;
  cloud: boolean;
  children: ReactNode;
}) {
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const busy = useRef(false);

  return (
    <form
      className="space-y-3"
      action={async (formData) => {
        if (busy.current) return;
        busy.current = true;
        setError("");
        setSending(true);

        try {
          const archive = formData.get("archive");
          if (!(archive instanceof File) || archive.size === 0) throw new Error("Selectionne un fichier .json ou .apkg.");
          const extension = archive.name.toLowerCase().split(".").pop();
          if (!extension || !["json", "apkg"].includes(extension)) throw new Error("Seuls les fichiers .json et .apkg sont acceptes.");
          if (archive.size > MAX_FLASHCARD_ARCHIVE_BYTES) throw new Error("Le fichier depasse la limite de 150 Mo.");

          if (cloud) {
            const mimeType = archive.type || "application/octet-stream";
            const response = await fetch("/api/uploads", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ folder: "flashcards", name: archive.name, mimeType, size: archive.size })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Preparation de l'import impossible.");

            const uploaded = await fetch(result.signedUrl, {
              method: "PUT",
              headers: { "Content-Type": mimeType, "x-upsert": "false" },
              body: archive
            });
            if (!uploaded.ok) throw new Error("Le paquet n'a pas pu etre envoye. Verifie ta connexion puis reessaie.");
            formData.delete("archive");
            formData.set("archiveReceipt", result.receipt);
          }

          await action(formData);
        } catch (cause) {
          if (cause && typeof cause === "object" && "digest" in cause && String(cause.digest).startsWith("NEXT_REDIRECT")) throw cause;
          setError(cause instanceof Error ? cause.message : "Import impossible. Reessaie.");
          busy.current = false;
          setSending(false);
        }
      }}
    >
      {error ? <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      {sending ? <p role="status" className="text-sm text-pine">Import en cours. Garde cette page ouverte.</p> : null}
      <fieldset disabled={sending} className="space-y-3 disabled:opacity-70">{children}</fieldset>
    </form>
  );
}
