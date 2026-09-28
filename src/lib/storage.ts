import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";

import {
  getFileStorageDriver,
  getStorageSignedUrlTtlSeconds,
  getSupabaseStorageBucket
} from "./app-config";
import { getSupabaseAdminClient } from "./supabase-admin";
import { allowedDocumentType, MAX_DOCUMENT_BYTES, validateDocumentBytes, type UploadFolder } from "./upload-rules";

const SUPABASE_STORAGE_PREFIX = "supabase:";

type SavedFile = {
  storageKey: string;
  publicUrl: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  absolutePath?: string;
};

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function createObjectPath(folder: string, fileName: string) {
  const safeName = sanitizeFileName(fileName || "document");
  return `${folder}/${randomUUID()}-${safeName}`;
}

function parseSupabaseStorageKey(storageKey: string) {
  if (!storageKey.startsWith(SUPABASE_STORAGE_PREFIX)) {
    return null;
  }

  const payload = storageKey.slice(SUPABASE_STORAGE_PREFIX.length);
  const separatorIndex = payload.indexOf(":");
  if (separatorIndex === -1) {
    return null;
  }

  return {
    bucket: payload.slice(0, separatorIndex),
    objectPath: payload.slice(separatorIndex + 1)
  };
}

function getFileNameFromStorageKey(storageKey: string) {
  const supabaseRef = parseSupabaseStorageKey(storageKey);
  if (supabaseRef) {
    return path.basename(supabaseRef.objectPath);
  }

  if (storageKey.startsWith("/")) {
    return path.basename(storageKey);
  }

  return "document";
}

async function saveUploadedFileLocally(file: File, folder: string): Promise<SavedFile> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const objectPath = createObjectPath(path.join("uploads", folder), file.name || "document");
  const relativePath = objectPath.replaceAll(path.sep, "/");
  const absoluteDir = path.join(process.cwd(), "public", path.dirname(objectPath));
  const absolutePath = path.join(process.cwd(), "public", objectPath);

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(absolutePath, buffer);

  return {
    storageKey: `/${relativePath}`,
    publicUrl: `/${relativePath}`,
    absolutePath,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: buffer.length
  };
}

async function saveUploadedFileToSupabase(file: File, folder: string): Promise<SavedFile> {
  const client = getSupabaseAdminClient();
  const bucket = getSupabaseStorageBucket();
  const objectPath = createObjectPath(folder, file.name || "document");
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await client.storage.from(bucket).upload(objectPath, arrayBuffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) {
    throw new Error(`SUPABASE_STORAGE_UPLOAD_FAILED:${error.message}`);
  }

  return {
    storageKey: `${SUPABASE_STORAGE_PREFIX}${bucket}:${objectPath}`,
    publicUrl: null,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: arrayBuffer.byteLength
  };
}

export async function saveUploadedFile(file: File, folder: string) {
  if (folder !== "essays" && folder !== "resources") throw new Error("INVALID_UPLOAD_FOLDER");
  validateDocumentBytes(new Uint8Array(await file.arrayBuffer()), file.type, folder);
  if (getFileStorageDriver() === "supabase") {
    return saveUploadedFileToSupabase(file, folder);
  }

  return saveUploadedFileLocally(file, folder);
}

type UploadReceipt = { userId: string; folder: UploadFolder; storageKey: string; mimeType: string; size: number; name: string; expiresAt: number };

function signUpload(payload: string) {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET_REQUIRED");
  return createHmac("sha256", secret).update(`upload:${payload}`).digest("hex");
}

export async function createDirectUpload(userId: string, folder: UploadFolder, name: string, mimeType: string, size: number) {
  if (!name || name.length > 150 || !allowedDocumentType(mimeType, folder) || !Number.isSafeInteger(size) || size < 1 || size > MAX_DOCUMENT_BYTES) throw new Error("INVALID_DOCUMENT");
  const bucket = getSupabaseStorageBucket();
  const objectPath = createObjectPath(`${folder}/${userId}`, name.slice(0, 150));
  const { data, error } = await getSupabaseAdminClient().storage.from(bucket).createSignedUploadUrl(objectPath);
  if (error || !data) throw new Error("UPLOAD_UNAVAILABLE");
  const receipt: UploadReceipt = { userId, folder, storageKey: `${SUPABASE_STORAGE_PREFIX}${bucket}:${objectPath}`, mimeType, size, name, expiresAt: Date.now() + 60 * 60 * 1000 };
  const payload = Buffer.from(JSON.stringify(receipt)).toString("base64url");
  return { signedUrl: data.signedUrl, receipt: `${payload}.${signUpload(payload)}` };
}

export async function resolveDirectUpload(receipt: string, userId: string, folder: UploadFolder) {
  if (receipt.length > 4096) throw new Error("INVALID_UPLOAD");
  const [payload, signature, extra] = receipt.split(".");
  if (!payload || extra !== undefined || !/^[a-f0-9]{64}$/.test(signature ?? "") ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(signUpload(payload)))) throw new Error("INVALID_UPLOAD");
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UploadReceipt;
  if (data.userId !== userId || data.folder !== folder || data.expiresAt <= Date.now()) throw new Error("INVALID_UPLOAD");
  const buffer = await readStoredFileBuffer(data.storageKey);
  if (buffer.length !== data.size) throw new Error("INVALID_UPLOAD");
  validateDocumentBytes(buffer, data.mimeType, folder);
  return { buffer, storedFile: {
    storageKey: data.storageKey, mimeType: data.mimeType, originalName: data.name, size: data.size, publicUrl: null
  } satisfies SavedFile };
}

export async function getStoredFileUrl(storageKey: string) {
  if (storageKey.startsWith("/")) {
    return storageKey;
  }

  const supabaseRef = parseSupabaseStorageKey(storageKey);
  if (!supabaseRef) {
    return null;
  }

  const client = getSupabaseAdminClient();
  const { data, error } = await client.storage
    .from(supabaseRef.bucket)
    .createSignedUrl(supabaseRef.objectPath, getStorageSignedUrlTtlSeconds());

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export async function readStoredFileBuffer(storageKey: string) {
  if (storageKey.startsWith("/")) {
    return readFile(path.join(process.cwd(), "public", storageKey));
  }

  const supabaseRef = parseSupabaseStorageKey(storageKey);
  if (!supabaseRef) {
    throw new Error("UNSUPPORTED_STORAGE_KEY");
  }

  const client = getSupabaseAdminClient();
  const { data, error } = await client.storage.from(supabaseRef.bucket).download(supabaseRef.objectPath);

  if (error || !data) {
    throw new Error(`SUPABASE_STORAGE_DOWNLOAD_FAILED:${error?.message ?? "unknown"}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

export function getStoredFileName(storageKey: string) {
  return getFileNameFromStorageKey(storageKey);
}
