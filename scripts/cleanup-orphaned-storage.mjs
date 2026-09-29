import pg from "pg";
import { createClient } from "@supabase/supabase-js";

import { loadMergedEnv } from "./load-env-files.mjs";

const env = {
  ...loadMergedEnv([".env", ".env.local", ".env.production", ".env.production.local"]),
  ...process.env
};
const apply = process.argv.includes("--apply");
const hoursFlagIndex = process.argv.indexOf("--older-than-hours");
const requestedHours = hoursFlagIndex === -1 ? 24 : Number(process.argv[hoursFlagIndex + 1]);
const olderThanHours = Number.isFinite(requestedHours) ? Math.max(6, Math.min(720, requestedHours)) : 24;
const connectionString = (env.DIRECT_URL || env.DATABASE_URL || "").trim();
const supabaseUrl = (env.SUPABASE_URL || "").trim();
const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const bucket = (env.SUPABASE_STORAGE_BUCKET || "prepa-files").trim();

if (!/^postgres(?:ql)?:\/\//.test(connectionString) || !supabaseUrl || !serviceRoleKey) {
  console.error("La connexion PostgreSQL et le stockage Supabase de production sont requis.");
  process.exit(1);
}

const database = new pg.Client({
  connectionString,
  ssl: connectionString.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 15_000,
  statement_timeout: 60_000
});
const storage = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
}).storage.from(bucket);

async function listDirectory(prefix, depth = 0) {
  if (depth > 4) return [];
  const entries = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" }
    });
    if (error) throw new Error(`Lecture du stockage impossible pour ${prefix}: ${error.message}`);
    const page = data ?? [];
    for (const item of page) {
      const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (!item.id && !item.metadata) {
        entries.push(...await listDirectory(objectPath, depth + 1));
      } else {
        entries.push({ objectPath, createdAt: item.created_at || item.updated_at || "" });
      }
    }
    if (page.length < 1000) break;
  }
  return entries;
}

try {
  await database.connect();
  const result = await database.query(`
    SELECT "storageKey" FROM "Resource" WHERE "storageKey" LIKE 'supabase:%'
    UNION
    SELECT "storageKey" FROM "Essay" WHERE "storageKey" LIKE 'supabase:%'
  `);
  const referenced = new Set(result.rows.map((row) => row.storageKey));
  const objects = (await Promise.all(
    ["essays", "resources", "flashcards"].map((prefix) => listDirectory(prefix))
  )).flat();
  const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;
  const candidates = objects.filter((object) => {
    const createdAt = new Date(object.createdAt).getTime();
    const storageKey = `supabase:${bucket}:${object.objectPath}`;
    return Number.isFinite(createdAt) && createdAt < cutoff && !referenced.has(storageKey);
  });

  console.log(`Stockage analyse : ${objects.length} fichier(s), ${referenced.size} reference(s) en base.`);
  console.log(`Fichiers abandonnes de plus de ${olderThanHours} h : ${candidates.length}.`);

  if (!apply) {
    console.log("Aucune suppression effectuee. Relance avec --apply apres verification.");
  } else if (candidates.length === 0) {
    console.log("Aucun nettoyage necessaire.");
  } else {
    for (let index = 0; index < candidates.length; index += 100) {
      const paths = candidates.slice(index, index + 100).map((candidate) => candidate.objectPath);
      const { error } = await storage.remove(paths);
      if (error) throw new Error(`Suppression impossible: ${error.message}`);
    }
    console.log(`${candidates.length} fichier(s) abandonne(s) supprime(s).`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Nettoyage impossible.");
  process.exitCode = 1;
} finally {
  await database.end().catch(() => undefined);
}
