import { spawnSync } from "node:child_process";
import { loadMergedEnv } from "./load-env-files.mjs";

const cliArgs = process.argv.slice(2);

if (cliArgs.length === 0) {
  console.error("Commande Prisma manquante.");
  process.exit(1);
}

const env = {
  ...process.env,
  ...loadMergedEnv([".env", ".env.local", ".env.production", ".env.production.local"])
};

const binary = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(binary, ["prisma", ...cliArgs, "--schema", "prisma/schema.production.prisma"], {
  stdio: "inherit",
  env
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
