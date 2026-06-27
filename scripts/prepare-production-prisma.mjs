import { readFileSync, writeFileSync } from "node:fs";

const sourcePath = "prisma/schema.prisma";
const targetPath = "prisma/schema.production.prisma";

const source = readFileSync(sourcePath, "utf8");
const prepared = source.replace('provider = "sqlite"', 'provider = "postgresql"');

writeFileSync(targetPath, prepared, "utf8");

console.log(`Schema production genere : ${targetPath}`);
