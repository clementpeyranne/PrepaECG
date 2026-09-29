export const MAX_DOCUMENT_BYTES = 50_000_000;
export const MAX_FLASHCARD_ARCHIVE_BYTES = 150_000_000;
export type UploadFolder = "essays" | "resources" | "flashcards";
const imageTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const flashcardTypes = ["application/json", "application/zip", "application/octet-stream", "application/x-anki"];

export function allowedDocumentType(type: string, folder: UploadFolder) {
  if (folder === "flashcards") return flashcardTypes.includes(type);
  return imageTypes.includes(type) || (folder === "resources" && ["text/plain", "text/markdown"].includes(type));
}

export function validateDocumentBytes(buffer: Uint8Array, type: string, folder: UploadFolder) {
  const maximumBytes = folder === "flashcards" ? MAX_FLASHCARD_ARCHIVE_BYTES : MAX_DOCUMENT_BYTES;
  if (!buffer.length || buffer.length > maximumBytes || !allowedDocumentType(type, folder)) throw new Error("INVALID_DOCUMENT");
  const prefix = Array.from(buffer.subarray(0, 12));
  const starts = (...bytes: number[]) => bytes.every((value, index) => prefix[index] === value);
  const firstVisibleByte = Array.from(buffer.subarray(0, Math.min(buffer.length, 64))).find((byte) => ![9, 10, 13, 32].includes(byte));
  const valid = folder === "flashcards" ? starts(80, 75) || firstVisibleByte === 123
    : type === "application/pdf" ? starts(37, 80, 68, 70, 45)
    : type === "image/png" ? starts(137, 80, 78, 71, 13, 10, 26, 10)
    : type === "image/jpeg" ? starts(255, 216, 255)
    : type === "image/webp" ? starts(82, 73, 70, 70) && prefix.slice(8, 12).join(",") === "87,69,66,80"
    : true;
  if (!valid) throw new Error("INVALID_DOCUMENT");
}

export function getMaximumUploadBytes(folder: UploadFolder) {
  return folder === "flashcards" ? MAX_FLASHCARD_ARCHIVE_BYTES : MAX_DOCUMENT_BYTES;
}
