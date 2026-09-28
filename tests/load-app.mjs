import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const root = fileURLToPath(new URL("../", import.meta.url));
const realRequire = createRequire(import.meta.url);

// Real application functions and Prisma queries; only external boundaries are replaced.
export function createAppLoader(mocks) {
  const loaded = new Map();
  function load(relative) {
    const file = path.resolve(root, relative);
    if (loaded.has(file)) return loaded.get(file).exports;
    const module = { exports: {} };
    loaded.set(file, module);
    const code = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
    }).outputText;
    const localRequire = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith(".")) return load(path.resolve(path.dirname(file), `${name}.ts`));
      if (name.startsWith("@/")) return load(`src/${name.slice(2)}.ts`);
      return realRequire(name);
    };
    new Function("exports", "require", "module", "__filename", "__dirname", code)(module.exports, localRequire, module, file, path.dirname(file));
    return module.exports;
  }
  return load;
}
