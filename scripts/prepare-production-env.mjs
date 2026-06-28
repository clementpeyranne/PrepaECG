import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const sourcePath = ".env.production.example";
const targetPath = ".env.production";

if (!existsSync(sourcePath)) {
  console.error(`${sourcePath} est introuvable.`);
  process.exit(1);
}

const source = readFileSync(sourcePath, "utf8");
const generatedSecret = randomBytes(48).toString("base64url");

const prepared = source.replace(
  'AUTH_SECRET="a-remplacer-par-un-secret-long-et-aleatoire"',
  `AUTH_SECRET="${generatedSecret}"`
);

if (existsSync(targetPath)) {
  console.log(`${targetPath} existe deja. Aucun ecrasement automatique.`);
  console.log("Complete simplement les valeurs encore manquantes.");
  process.exit(0);
}

writeFileSync(targetPath, prepared, "utf8");

console.log(`${targetPath} a ete cree.`);
console.log("Valeurs encore a renseigner avant deploiement :");
console.log('- DATABASE_URL');
console.log('- DIRECT_URL');
console.log('- NEXT_PUBLIC_APP_URL');
console.log('- NEXT_PUBLIC_SUPPORT_EMAIL');
console.log('- NEXT_PUBLIC_LEGAL_NAME');
console.log('- NEXT_PUBLIC_LEGAL_ADDRESS');
console.log('- NEXT_PUBLIC_PUBLICATION_DIRECTOR');
console.log('- SUPABASE_URL');
console.log('- SUPABASE_SERVICE_ROLE_KEY');
console.log('- OPENAI_API_KEY (si tu veux activer OpenAI en production)');
