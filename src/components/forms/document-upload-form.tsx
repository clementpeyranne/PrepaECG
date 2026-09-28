"use client";

import { useRef, useState, type ReactNode } from "react";
import { allowedDocumentType, MAX_DOCUMENT_BYTES, type UploadFolder } from "@/lib/upload-rules";

export function DocumentUploadForm({ action, folder, cloud, children }: {
  action: (formData: FormData) => Promise<void>; folder: UploadFolder; cloud: boolean; children: ReactNode;
}) {
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const busy = useRef(false);
  return <form className="space-y-5" action={async (formData) => {
    if (busy.current) return;
    busy.current = true;
    setError("");
    setSending(true);
    try {
      const file = formData.get("file");
      if (file instanceof File && file.size > 0) {
        if (!allowedDocumentType(file.type, folder) || file.size > MAX_DOCUMENT_BYTES) throw new Error("Utilise un PDF, JPG, PNG ou WebP de moins de 50 Mo (ou un fichier texte pour un cours).");
        if (cloud) {
          const response = await fetch("/api/uploads", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder, name: file.name, mimeType: file.type, size: file.size })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Preparation de l'envoi impossible.");
          const uploaded = await fetch(result.signedUrl, {
            method: "PUT", headers: { "Content-Type": file.type, "x-upsert": "false" }, body: file
          });
          if (!uploaded.ok) throw new Error("Le fichier n'a pas pu etre envoye. Verifie ta connexion puis reessaie.");
          formData.delete("file");
          formData.set("uploadReceipt", result.receipt);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Envoi impossible. Reessaie.");
      busy.current = false;
      setSending(false);
      return;
    }
    try { await action(formData); }
    catch (cause) {
      if (cause && typeof cause === "object" && "digest" in cause && String(cause.digest).startsWith("NEXT_REDIRECT")) throw cause;
      setError("Enregistrement non confirme. Verifie ta connexion et reessaie : un meme envoi ne sera pas cree deux fois.");
    }
    finally { busy.current = false; setSending(false); }
  }}>
    {error ? <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
    {sending ? <p role="status" className="text-sm text-pine">Envoi et enregistrement en cours. Garde cette page ouverte.</p> : null}
    <fieldset disabled={sending} className="space-y-5 disabled:opacity-70">{children}</fieldset>
  </form>;
}
