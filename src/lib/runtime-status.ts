import { prisma } from "./db";
import {
  getAppMode,
  getFileStorageDriver,
  getPasswordResetMode,
  getPublicAppUrl,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isDemoModeEnabled
} from "./app-config";

type CheckState = "pass" | "warn" | "fail";

type RuntimeCheck = {
  label: string;
  state: CheckState;
  detail: string;
};

function getAuthSecretStatus(): RuntimeCheck {
  const authSecret = process.env.AUTH_SECRET?.trim() || "";

  if (!authSecret) {
    return {
      label: "auth",
      state: isDemoModeEnabled() ? "warn" : "fail",
      detail: isDemoModeEnabled()
        ? "Secret de demonstration utilise localement."
        : "AUTH_SECRET est manquant."
    };
  }

  if (authSecret === "dev-prepa-ecg-os-secret-change-me") {
    return {
      label: "auth",
      state: getAppMode() === "production" ? "fail" : "warn",
      detail:
        getAppMode() === "production"
          ? "AUTH_SECRET utilise encore la valeur de demonstration."
          : "AUTH_SECRET utilise encore la valeur de demonstration."
    };
  }

  return {
    label: "auth",
    state: "pass",
    detail: "Secret d'authentification personnalise."
  };
}

function getStorageStatus(): RuntimeCheck {
  const driver = getFileStorageDriver();

  if (driver === "local") {
    return {
      label: "storage",
      state: getAppMode() === "production" ? "fail" : "pass",
      detail:
        getAppMode() === "production"
          ? "Stockage local actif. Un stockage cloud est requis pour la production."
          : "Stockage local actif."
    };
  }

  if (!getSupabaseUrl() || !getSupabaseServiceRoleKey()) {
    return {
      label: "storage",
      state: "fail",
      detail: "Le stockage Supabase est active mais la configuration est incomplete."
    };
  }

  return {
    label: "storage",
    state: "pass",
    detail: "Stockage Supabase configure."
  };
}

function getAppUrlStatus(): RuntimeCheck {
  const publicUrl = getPublicAppUrl();

  if (!publicUrl || publicUrl.includes("localhost")) {
    return {
      label: "app_url",
      state: getAppMode() === "production" ? "fail" : "pass",
      detail:
        getAppMode() === "production"
          ? "L'URL publique pointe encore vers localhost ou n'est pas finalisee."
          : "URL locale de developpement active."
    };
  }

  if (getAppMode() === "production" && !publicUrl.startsWith("https://")) {
    return {
      label: "app_url",
      state: "warn",
      detail: "L'URL publique est definie mais n'utilise pas HTTPS."
    };
  }

  return {
    label: "app_url",
    state: "pass",
    detail: "URL publique configuree."
  };
}

function getPasswordResetStatus(): RuntimeCheck {
  const mode = getPasswordResetMode();

  if (mode === "direct-link") {
    return {
      label: "password_reset",
      state: getAppMode() === "production" ? "warn" : "pass",
      detail:
        getAppMode() === "production"
          ? "Le mot de passe oublie utilise encore le mode lien direct prive."
          : "Le mot de passe oublie fonctionne avec lien direct local."
    };
  }

  return {
    label: "password_reset",
    state: "pass",
    detail: "La reinitialisation de mot de passe est geree via le support."
  };
}

function getAiStatus(): RuntimeCheck {
  const apiKey = process.env.OPENAI_API_KEY?.trim() || "";

  if (!apiKey) {
    return {
      label: "ai",
      state: "warn",
      detail: "OpenAI n'est pas encore configure."
    };
  }

  return {
    label: "ai",
    state: "pass",
    detail: "Configuration OpenAI detectee."
  };
}

export async function getRuntimeStatus() {
  const checks: RuntimeCheck[] = [
    getAuthSecretStatus(),
    getStorageStatus(),
    getAppUrlStatus(),
    getPasswordResetStatus(),
    getAiStatus()
  ];

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.unshift({
      label: "database",
      state: "pass",
      detail: "Connexion base de donnees operationnelle."
    });
  } catch (error) {
    checks.unshift({
      label: "database",
      state: "fail",
      detail: error instanceof Error ? error.message : "Connexion base de donnees impossible."
    });
  }

  const hasFailure = checks.some((check) => check.state === "fail");
  const hasWarning = checks.some((check) => check.state === "warn");

  return {
    appMode: getAppMode(),
    status: hasFailure ? "fail" : hasWarning ? "warn" : "pass",
    checks
  };
}
