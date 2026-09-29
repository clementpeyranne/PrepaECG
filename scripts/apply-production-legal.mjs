import { readFile } from "node:fs/promises";
import pg from "pg";

import { loadMergedEnv } from "./load-env-files.mjs";

const env = {
  ...loadMergedEnv([".env", ".env.local", ".env.production", ".env.production.local"]),
  ...process.env
};
const connectionString = (env.DIRECT_URL || env.DATABASE_URL || "").trim();

if (!/^postgres(?:ql)?:\/\//.test(connectionString)) {
  console.error("Une URL PostgreSQL de production est requise.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 15_000,
  statement_timeout: 60_000
});

try {
  await client.connect();
  await client.query(await readFile("prisma/production-legal.sql", "utf8"));
  console.log("Preuve d'acceptation legale ajoutee sans suppression de donnees.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Migration legale impossible.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
