import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  getFileStorageDriver,
  getStorageSignedUrlTtlSeconds,
  getSupabaseStorageBucket
} from "./app-config";
import { getSupabaseAdminClient } from "./supabase-admin";

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
  return `${folder}/${Date.now()}-${safeName}`;
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
  if (getFileStorageDriver() === "supabase") {
    return saveUploadedFileToSupabase(file, folder);
  }

  return saveUploadedFileLocally(file, folder);
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
