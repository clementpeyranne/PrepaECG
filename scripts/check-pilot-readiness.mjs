import { loadMergedEnv } from "./load-env-files.mjs";

const env = { ...loadMergedEnv([".env", ".env.local", ".env.production", ".env.production.local"]), ...process.env };
const baseUrl = (env.PILOT_URL || env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
if (!baseUrl.startsWith("https://")) {
  console.error("Renseigne une URL publique HTTPS avant la verification du pilote.");
  process.exit(1);
}

console.log(`Preparation du pilote : ${baseUrl}`);
try {
  const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(15_000), headers: { "Cache-Control": "no-cache" } });
  const health = await response.json();
  const checks = Array.isArray(health.checks) ? health.checks : [];
  const required = ["database", "auth", "storage", "app_url", "password_reset", "legal", "ai"];
  let blockers = 0;
  for (const label of required) {
    const check = checks.find((entry) => entry.label === label);
    const pass = check?.state === "pass";
    if (!pass) blockers += 1;
    console.log(`${pass ? "OK" : "A TERMINER"} - ${label} : ${check?.detail || "Controle absent"}`);
  }
  if (!response.ok || health.appMode !== "production") blockers += 1;
  console.log("Ces controles ne remplacent pas les tests iPhone/Android, la qualite pedagogique, les sauvegardes et l'accord avec la prepa.");
  console.log(blockers ? `${blockers} blocage(s) avant le pilote avec toutes les fonctions.` : "Configuration prete pour la recette finale du pilote.");
  process.exitCode = blockers ? 1 : 0;
} catch {
  console.error("Le site ne repond pas normalement. Verifie le projet Supabase et le deploiement Vercel.");
  process.exitCode = 1;
}
