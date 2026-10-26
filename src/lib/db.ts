import { PrismaClient } from "@prisma/client";
import { getRuntimeDatabaseUrl } from "./database-url";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    datasourceUrl: getRuntimeDatabaseUrl(process.env.DATABASE_URL),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

// Share the client between route bundles and concurrent requests in the same Vercel instance.
global.prisma = prisma;
