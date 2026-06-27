import { readFileSync, writeFileSync } from "node:fs";

const sourcePath = "prisma/schema.prisma";
const targetPath = "prisma/schema.production.prisma";

const source = readFileSync(sourcePath, "utf8");
const prepared = source
  .replace('provider = "sqlite"', 'provider = "postgresql"')
  .replace('url      = env("DATABASE_URL")', 'url      = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")');

writeFileSync(targetPath, prepared, "utf8");

console.log(`Schema production genere : ${targetPath}`);
