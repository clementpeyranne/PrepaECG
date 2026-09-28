export const MAX_DOCUMENT_BYTES = 50_000_000;
export type UploadFolder = "essays" | "resources";
const imageTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export function allowedDocumentType(type: string, folder: UploadFolder) {
  return imageTypes.includes(type) || (folder === "resources" && ["text/plain", "text/markdown"].includes(type));
}

export function validateDocumentBytes(buffer: Uint8Array, type: string, folder: UploadFolder) {
  if (!buffer.length || buffer.length > MAX_DOCUMENT_BYTES || !allowedDocumentType(type, folder)) throw new Error("INVALID_DOCUMENT");
  const prefix = Array.from(buffer.subarray(0, 12));
  const starts = (...bytes: number[]) => bytes.every((value, index) => prefix[index] === value);
  const valid = type === "application/pdf" ? starts(37, 80, 68, 70, 45)
    : type === "image/png" ? starts(137, 80, 78, 71, 13, 10, 26, 10)
    : type === "image/jpeg" ? starts(255, 216, 255)
    : type === "image/webp" ? starts(82, 73, 70, 70) && prefix.slice(8, 12).join(",") === "87,69,66,80"
    : true;
  if (!valid) throw new Error("INVALID_DOCUMENT");
}
