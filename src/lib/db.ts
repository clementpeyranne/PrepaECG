import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function getDatasourceUrl() {
  const rawUrl = process.env.DATABASE_URL?.trim();

  if (!rawUrl) {
    return undefined;
  }

  const isSupabaseSessionPooler = rawUrl.includes("pooler.supabase.com:5432");
  const alreadyLimited = /(?:\?|&)connection_limit=/.test(rawUrl);

  if (!isSupabaseSessionPooler || alreadyLimited) {
    return rawUrl;
  }

  return `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}connection_limit=1`;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    datasourceUrl: getDatasourceUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
