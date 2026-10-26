import { AIServiceError } from "./ai-errors";

export type AIDocument = { mimeType: string; fileName: string; base64Data: string };
export const MAX_AI_DOCUMENT_BYTES = 20_000_000;
const AI_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export function supportsAIDocument(mimeType: string) {
  return AI_DOCUMENT_TYPES.includes(mimeType);
}

export function buildAIDocumentContent(document: AIDocument) {
  if (!supportsAIDocument(document.mimeType)) {
    throw new AIServiceError("DOCUMENT_TYPE", "Choisis un document PDF ou une photo JPEG, PNG ou WebP pour l'analyse IA.");
  }
  const bytes = Buffer.from(document.base64Data, "base64");
  if (!bytes.length || bytes.length > MAX_AI_DOCUMENT_BYTES) {
    throw new AIServiceError("DOCUMENT_SIZE", "Pour l'analyse IA, divise ce document en fichiers de moins de 20 Mo. Le document original reste disponible.");
  }
  return document.mimeType === "application/pdf"
    ? { type: "input_file", filename: document.fileName, file_data: `data:application/pdf;base64,${document.base64Data}` }
    : { type: "input_image", image_url: `data:${document.mimeType};base64,${document.base64Data}` };
}

export function buildAIInput(prompt: string, documents: AIDocument[] = []) {
  return documents.length
    ? [{ role: "user", content: [{ type: "input_text", text: prompt }, ...documents.map(buildAIDocumentContent)] }]
    : prompt;
}
