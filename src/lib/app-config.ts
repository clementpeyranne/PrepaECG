export type AppMode = "demo" | "production";
export type FileStorageDriver = "local" | "supabase";
export type PasswordResetMode = "support" | "direct-link";

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function getAppMode(): AppMode {
  return normalize(process.env.APP_MODE) === "production" ? "production" : "demo";
}

export function isDemoModeEnabled() {
  return getAppMode() === "demo";
}

export function getFileStorageDriver(): FileStorageDriver {
  return normalize(process.env.FILE_STORAGE_DRIVER) === "supabase" ? "supabase" : "local";
}

export function getPublicAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

export function getPasswordResetMode(): PasswordResetMode {
  const configured = normalize(process.env.PASSWORD_RESET_MODE);

  if (configured === "direct-link") {
    return "direct-link";
  }

  return isDemoModeEnabled() ? "direct-link" : "support";
}

export function getSupabaseUrl() {
  return process.env.SUPABASE_URL?.trim() || "";
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
}

export function getSupabaseStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "prepa-files";
}

export function getStorageSignedUrlTtlSeconds() {
  const raw = Number(process.env.STORAGE_SIGNED_URL_TTL_SEC || "3600");
  return Number.isFinite(raw) && raw > 0 ? raw : 3600;
}
