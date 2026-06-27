import { existsSync, readFileSync } from "node:fs";

export function loadEnvFile(fileName) {
  if (!existsSync(fileName)) {
    return {};
  }

  const content = readFileSync(fileName, "utf8");
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

export function loadMergedEnv(fileNames) {
  return fileNames.reduce(
    (accumulator, fileName) => ({
      ...accumulator,
      ...loadEnvFile(fileName)
    }),
    {}
  );
}
