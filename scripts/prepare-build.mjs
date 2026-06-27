import { spawnSync } from "node:child_process";
import { loadMergedEnv } from "./load-env-files.mjs";

const mergedEnv =
  process.env.APP_MODE?.trim().toLowerCase() === "production"
    ? {
        ...loadMergedEnv([".env", ".env.local", ".env.production", ".env.production.local"]),
        ...process.env
      }
    : {
        ...loadMergedEnv([".env", ".env.local"]),
        ...process.env
      };

const appMode = (mergedEnv.APP_MODE || "demo").trim().toLowerCase();
const npmBinary = process.platform === "win32" ? "npm.cmd" : "npm";
const scriptName = appMode === "production" ? "prisma:generate:prod" : "prisma:generate";

console.log(`Preparation Prisma pour le build (${appMode}).`);

const result = spawnSync(npmBinary, ["run", scriptName], {
  stdio: "inherit",
  env: mergedEnv
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
