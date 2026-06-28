export type AppMode = "demo" | "production";
export type FileStorageDriver = "local" | "supabase";
export type PasswordResetMode = "support" | "direct-link";
export type PublicAppUrlSource = "explicit" | "vercel-production" | "vercel-preview" | "local";

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

function normalizeAppUrl(raw: string) {
  const value = raw.trim();
  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.replace(/\/+$/, "");
  }

  return `https://${value.replace(/\/+$/, "")}`;
}

export function getPublicAppUrlDetails() {
  const explicit = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL || "");
  if (explicit) {
    return {
      url: explicit,
      source: "explicit" as PublicAppUrlSource
    };
  }

  const vercelProduction = normalizeAppUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL || "");
  if (vercelProduction) {
    return {
      url: vercelProduction,
      source: "vercel-production" as PublicAppUrlSource
    };
  }

  const vercelPreview = normalizeAppUrl(process.env.VERCEL_URL || "");
  if (vercelPreview) {
    return {
      url: vercelPreview,
      source: "vercel-preview" as PublicAppUrlSource
    };
  }

  return {
    url: "http://localhost:3000",
    source: "local" as PublicAppUrlSource
  };
}

export function getPublicAppUrl() {
  return getPublicAppUrlDetails().url;
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
