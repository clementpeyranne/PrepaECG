import { loadMergedEnv } from "./load-env-files.mjs";

const env = {
  ...loadMergedEnv([".env", ".env.local", ".env.production", ".env.production.local"]),
  ...process.env
};

const appMode = (env.APP_MODE || "demo").trim().toLowerCase();
const databaseUrl = (env.DATABASE_URL || "").trim();
const directUrl = (env.DIRECT_URL || "").trim();
const authSecret = (env.AUTH_SECRET || "").trim();
const appUrl = (env.NEXT_PUBLIC_APP_URL || "").trim();
const vercelProductionUrl = (env.VERCEL_PROJECT_PRODUCTION_URL || "").trim();
const vercelPreviewUrl = (env.VERCEL_URL || "").trim();
const passwordResetMode = (env.PASSWORD_RESET_MODE || "support").trim().toLowerCase();
const supportEmail = (env.NEXT_PUBLIC_SUPPORT_EMAIL || "").trim();
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
} else if (databaseUrl.includes("pooler.supabase.com:5432")) {
  warnings.push(
    "DATABASE_URL semble utiliser le pooler Supabase en mode session. Pour Vercel + Prisma, prevois plutot une URL runtime moins fragile et garde DIRECT_URL pour les operations Prisma."
  );
}

if (!directUrl) {
  warnings.push("DIRECT_URL n'est pas defini. Il est recommande pour les operations Prisma de schema et migration.");
} else if (directUrl.startsWith("file:")) {
  warnings.push("DIRECT_URL pointe encore vers SQLite local.");
} else if (usesPlaceholder(directUrl, ["USER", "PASSWORD", "HOST"])) {
  warnings.push("DIRECT_URL contient encore des valeurs d'exemple.");
}

if (!authSecret || authSecret === "dev-prepa-ecg-os-secret-change-me") {
  errors.push("AUTH_SECRET doit etre personnalise avant mise en ligne.");
}

if (!appUrl) {
  if (vercelProductionUrl) {
    warnings.push(
      "NEXT_PUBLIC_APP_URL n'est pas defini. Vercel pourra deduire l'URL publique, mais il vaut mieux la fixer explicitement."
    );
  } else if (vercelPreviewUrl) {
    warnings.push(
      "NEXT_PUBLIC_APP_URL n'est pas defini. L'application risque de s'appuyer sur une URL de preview Vercel."
    );
  } else {
    errors.push("NEXT_PUBLIC_APP_URL n'est pas defini.");
  }
} else if (appUrl.includes("localhost")) {
  errors.push("NEXT_PUBLIC_APP_URL pointe encore vers localhost.");
} else if (appUrl.includes("ton-domaine.fr")) {
  warnings.push("NEXT_PUBLIC_APP_URL contient encore le domaine d'exemple.");
} else if (!appUrl.startsWith("https://")) {
  warnings.push("NEXT_PUBLIC_APP_URL devrait idealement utiliser HTTPS.");
}

if (fileStorageDriver === "local") {
  errors.push(
    "FILE_STORAGE_DRIVER est encore sur local. Pour un vrai deploiement, il faut un stockage cloud pour les PDF et photos."
  );
}

if (!supportEmail) {
  warnings.push("NEXT_PUBLIC_SUPPORT_EMAIL n'est pas defini.");
}

if (passwordResetMode === "direct-link") {
  warnings.push(
    "PASSWORD_RESET_MODE est sur direct-link. C'est pratique pour une beta privee, mais moins adapte a une ouverture publique."
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
