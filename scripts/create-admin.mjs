import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import pg from "pg";

import { loadMergedEnv } from "./load-env-files.mjs";

function readFlag(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? "" : String(process.argv[index + 1] ?? "").trim();
}

if (!process.argv.includes("--confirm-admin")) {
  console.error("Confirmation explicite requise : utilise npm run admin:create:prod.");
  process.exit(1);
}

const email = readFlag("email").toLowerCase();
const firstName = readFlag("first-name") || "Administrateur";
const lastName = readFlag("last-name") || "Plateforme";
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage : npm run admin:create:prod -- --email "admin@exemple.fr" [--first-name "Prenom"] [--last-name "Nom"]');
  process.exit(1);
}

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
  const existing = await client.query('SELECT "id", "role" FROM "User" WHERE "email" = $1 LIMIT 1', [email]);
  if (existing.rowCount) {
    await client.query('UPDATE "User" SET "role" = \'ADMIN\', "isActive" = true, "updatedAt" = NOW() WHERE "id" = $1', [existing.rows[0].id]);
    console.log("Compte existant promu administrateur et reactive.");
    console.log(`- Email : ${email}`);
    console.log("- Mot de passe : inchange");
  } else {
    const temporaryPassword = randomBytes(15).toString("base64url");
    const salt = randomBytes(16).toString("hex");
    const passwordHash = `${salt}:${scryptSync(temporaryPassword, salt, 64).toString("hex")}`;
    const now = new Date();
    await client.query(
      'INSERT INTO "User" ("id", "email", "passwordHash", "firstName", "lastName", "role", "isActive", "loginCount", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, \'ADMIN\', true, 0, $6, $6)',
      [randomUUID(), email, passwordHash, firstName, lastName, now]
    );
    console.log("Compte administrateur cree.");
    console.log(`- Email : ${email}`);
    console.log(`- Mot de passe temporaire : ${temporaryPassword}`);
    console.log("Connecte-toi puis remplace ce mot de passe depuis la procedure de recuperation des qu'elle est active.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Creation du compte administrateur impossible.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
