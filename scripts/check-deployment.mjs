import { loadMergedEnv } from "./load-env-files.mjs";

const env = {
  ...loadMergedEnv([".env", ".env.local", ".env.production", ".env.production.local"]),
  ...process.env
};

const appMode = (env.APP_MODE || "demo").trim().toLowerCase();
const databaseUrl = (env.DATABASE_URL || "").trim();
const authSecret = (env.AUTH_SECRET || "").trim();
const appUrl = (env.NEXT_PUBLIC_APP_URL || "").trim();
const fileStorageDriver = (env.FILE_STORAGE_DRIVER || "local").trim().toLowerCase();
const supabaseUrl = (env.SUPABASE_URL || "").trim();
const supabaseServiceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const supabaseStorageBucket = (env.SUPABASE_STORAGE_BUCKET || "").trim();

const errors = [];
const warnings = [];

function usesPlaceholder(value, patterns) {
  return patterns.some((pattern) => value.includes(pattern));
}

if (appMode !== "production") {
  errors.push("APP_MODE doit etre defini sur production pour un vrai deploiement.");
}

if (!databaseUrl) {
  errors.push("DATABASE_URL est manquant.");
} else if (databaseUrl.startsWith("file:")) {
  errors.push("DATABASE_URL pointe encore vers SQLite local. Pour la prod, prevois une base PostgreSQL en ligne.");
} else if (usesPlaceholder(databaseUrl, ["USER", "PASSWORD", "HOST"])) {
  errors.push("DATABASE_URL contient encore des valeurs d'exemple.");
}

if (!authSecret || authSecret === "dev-prepa-ecg-os-secret-change-me") {
  errors.push("AUTH_SECRET doit etre personnalise avant mise en ligne.");
}

if (!appUrl) {
  warnings.push("NEXT_PUBLIC_APP_URL n'est pas defini. Il faudra indiquer l'URL publique du site.");
} else if (appUrl.includes("localhost")) {
  warnings.push("NEXT_PUBLIC_APP_URL pointe encore vers localhost.");
} else if (appUrl.includes("ton-domaine.fr")) {
  warnings.push("NEXT_PUBLIC_APP_URL contient encore le domaine d'exemple.");
}

if (fileStorageDriver === "local") {
  warnings.push(
    "FILE_STORAGE_DRIVER est encore sur local. Pour un vrai deploiement, il faudra brancher un stockage cloud pour les PDF et photos."
  );
}

if (fileStorageDriver === "supabase") {
  if (!supabaseUrl) {
    errors.push("SUPABASE_URL est manquant alors que FILE_STORAGE_DRIVER utilise supabase.");
  } else if (supabaseUrl.includes("xxxxx.supabase.co")) {
    errors.push("SUPABASE_URL contient encore la valeur d'exemple.");
  }

  if (!supabaseServiceRoleKey) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY est manquant alors que FILE_STORAGE_DRIVER utilise supabase.");
  } else if (supabaseServiceRoleKey === "a-remplacer") {
    errors.push("SUPABASE_SERVICE_ROLE_KEY contient encore la valeur d'exemple.");
  }

  if (!supabaseStorageBucket) {
    warnings.push("SUPABASE_STORAGE_BUCKET n'est pas defini. Le bucket par defaut sera utilise.");
  }
}

warnings.push(
  "Avant la mise en ligne, pense a generer le schema Prisma de production avec `npm run prisma:prepare:prod`."
);

warnings.push(
  "Apres deploiement, verifie aussi le point de sante `/api/health` pour confirmer la base, l'authentification et le stockage."
);

console.log("Verification de deploiement");
console.log("---------------------------");

if (errors.length === 0) {
  console.log("Aucun blocage critique detecte.");
} else {
  console.log("Blocages critiques :");
  for (const error of errors) {
    console.log(`- ${error}`);
  }
}

if (warnings.length > 0) {
  console.log("");
  console.log("Points a prevoir ensuite :");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

process.exit(errors.length > 0 ? 1 : 0);
