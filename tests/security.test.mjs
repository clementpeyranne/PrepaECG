import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { scryptSync } from "node:crypto";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

// Load the actual TypeScript modules with explicit mocks, never a real database.
function loadModule(path, env, mocks = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports, Buffer, process: { env },
    require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith("node:")) return require(name);
      throw new Error(`Unexpected import: ${name}`);
    }
  }, { filename: path });
  return module.exports;
}

const production = {
  NODE_ENV: "production", APP_MODE: "production", VERCEL: "1",
  AUTH_SECRET: "test-only-not-a-production-secret", PASSWORD_RESET_MODE: "direct-link"
};

function createAuth(env = production) {
  let cookie;
  const passwordHash = `test-salt:${scryptSync("test-password", "test-salt", 64).toString("hex")}`;
  const state = { user: { id: "user-1", email: "student@example.test", passwordHash, role: "STUDENT" } };
  const db = {
    user: { findUnique: async () => state.user },
    passwordResetToken: {
      findUnique: async () => null,
      create: async () => { throw new Error("Unexpected reset token creation"); },
      deleteMany: async () => { throw new Error("Unexpected reset token deletion"); }
    }
  };
  const config = loadModule("src/lib/app-config.ts", env);
  const auth = loadModule("src/lib/auth.ts", env, {
    "@prisma/client": { UserRole: { STUDENT: "STUDENT", TEACHER: "TEACHER", ADMIN: "ADMIN" } },
    react: { cache: (fn) => fn },
    "next/headers": { cookies: async () => ({
      get: () => cookie === undefined ? undefined : { value: cookie },
      set: (name, value) => { cookie = value; },
      delete: () => { throw new Error("Cookie mutation during rendering"); }
    }) },
    "./app-config": config, "./db": { prisma: db },
    "./reference-data": { ensureReferenceData: async () => {} }
  });
  return { auth, db, state, getCookie: () => cookie, setCookie: (value) => { cookie = value; } };
}

test("direct recovery links are confined to development demos, never Vercel", () => {
  for (const env of [
    production,
    { ...production, APP_MODE: "demo" },
    { ...production, APP_MODE: "demo", NODE_ENV: "development" },
    { APP_MODE: "production", NODE_ENV: "development", PASSWORD_RESET_MODE: "direct-link" },
    { APP_MODE: "demo", NODE_ENV: "production", PASSWORD_RESET_MODE: "direct-link" },
    { APP_MODE: "demo" }
  ]) {
    assert.equal(loadModule("src/lib/app-config.ts", env).getPasswordResetMode(), "support");
  }
  const local = { APP_MODE: "demo", NODE_ENV: "development" };
  assert.equal(loadModule("src/lib/app-config.ts", local).getPasswordResetMode(), "direct-link");
  assert.equal(loadModule("src/lib/app-config.ts", { ...local, PASSWORD_RESET_MODE: "support" }).getPasswordResetMode(), "support");
});

test("production recovery reports unavailability without looking up accounts or storing tokens", async () => {
  const { auth, db } = createAuth();
  db.user.findUnique = async () => { throw new Error("Unexpected account lookup"); };
  const result = await auth.requestPasswordReset("student@example.test");
  assert.equal(result.ok, false);
  assert.match(result.message, /Aucune demande/);
  assert.equal(result.resetToken, undefined);
});

test("local demo recovery stores only a hash and provides a token, not an arbitrary URL", async () => {
  const { auth, db } = createAuth({ ...production, NODE_ENV: "development", APP_MODE: "demo", VERCEL: "" });
  let stored;
  db.passwordResetToken.deleteMany = async () => {};
  db.passwordResetToken.create = async ({ data }) => { stored = data; };
  const result = await auth.requestPasswordReset("student@example.test");
  assert.equal(result.ok, true);
  assert.match(result.resetToken, /^[a-f0-9]{64}$/);
  assert.notEqual(stored.tokenHash, result.resetToken);
  assert.equal(result.resetLink, undefined);
});

test("login session works; a password change invalidates it", async () => {
  const { auth, state, getCookie, setCookie } = createAuth();
  assert.equal((await auth.loginUser({ email: state.user.email, password: "test-password" })).ok, true);
  const cookie = getCookie();
  assert.equal((await auth.getCurrentUser()).id, state.user.id);
  const tampered = cookie.slice(0, -1) + (cookie.endsWith("0") ? "1" : "0");
  setCookie(tampered);
  assert.equal(await auth.getCurrentUser(), null);
  setCookie(cookie);
  state.user = { ...state.user, passwordHash: "changed" };
  assert.equal(await auth.getCurrentUser(), null);
});

test("malformed, expired and legacy cookies are rejected without mutating cookies or querying the database", async () => {
  const { auth, db, setCookie } = createAuth();
  db.user.findUnique = async () => { throw new Error("Unexpected account lookup"); };
  for (const cookie of [
    undefined, "", "broken", "user-1.9999999999999." + "a".repeat(64),
    "v2.user-1.1." + "a".repeat(64),
    "v2.user-1.9999999999999." + "é".repeat(64),
    "v2.user-1.9999999999999." + "a".repeat(64) + ".extra",
    "v2.user-1.Infinity." + "a".repeat(64),
    "v2.user-1.9007199254740992." + "a".repeat(64)
  ]) {
    setCookie(cookie);
    assert.equal(await auth.getCurrentUser(), null);
  }
});

test("only one concurrent password reset can consume the same token", async () => {
  const { auth, db, state, getCookie, setCookie } = createAuth();
  await auth.loginUser({ email: state.user.email, password: "test-password" });
  const oldCookie = getCookie();
  let claimed = false;
  let updates = 0;
  db.passwordResetToken.findUnique = async () => ({
    id: "reset-1", userId: state.user.id, user: state.user, usedAt: null,
    expiresAt: new Date(Date.now() + 60000)
  });
  db.$transaction = async (callback) => callback({
    passwordResetToken: {
      updateMany: async ({ where }) => {
        assert.equal(where.usedAt, null);
        assert.equal(where.id, "reset-1");
        assert.ok(where.expiresAt.gt.getTime() <= Date.now());
        if (claimed) return { count: 0 };
        claimed = true;
        return { count: 1 };
      },
      deleteMany: async () => {}
    },
    user: { update: async ({ data }) => {
      updates++;
      state.user = { ...state.user, ...data };
      return state.user;
    } }
  });
  const attempts = await Promise.all([
    auth.resetPasswordFromToken({ token: "a".repeat(64), password: "new-password-one" }),
    auth.resetPasswordFromToken({ token: "a".repeat(64), password: "new-password-two" })
  ]);
  assert.equal(attempts.filter((result) => result.ok).length, 1);
  assert.equal(updates, 1);
  assert.equal((await auth.getCurrentUser()).id, state.user.id);
  setCookie(oldCookie);
  assert.equal(await auth.getCurrentUser(), null);
});

test("expired or used reset tokens never start a password update", async () => {
  const { auth, db } = createAuth();
  db.$transaction = async () => { throw new Error("Unexpected transaction"); };
  for (const record of [null, { usedAt: new Date(), expiresAt: new Date(Date.now() + 60000) }, { usedAt: null, expiresAt: new Date(0) }]) {
    db.passwordResetToken.findUnique = async () => record;
    assert.equal((await auth.resetPasswordFromToken({ token: "a".repeat(64), password: "new-password" })).ok, false);
  }
});

test("health reports missing email recovery and does not leak database errors", async () => {
  const config = loadModule("src/lib/app-config.ts", production);
  const status = loadModule("src/lib/runtime-status.ts", production, {
    "./app-config": config,
    "./db": { prisma: { $queryRaw: async () => { throw new Error("private-host-and-credentials"); } } }
  });
  const result = await status.getRuntimeStatus();
  assert.equal(result.checks.find((check) => check.label === "password_reset").state, "warn");
  assert.equal(result.checks.find((check) => check.label === "database").state, "fail");
  assert.doesNotMatch(JSON.stringify(result), /private-host-and-credentials/);
});

function createWorker({ offline = false, hasFallback = true } = {}) {
  const handlers = {};
  const calls = { added: [], deleted: [], matched: [], claimed: false, skipped: false };
  const cache = {
    add: async (request) => { calls.added.push(new URL(request.url).pathname); },
    match: async (key) => {
      calls.matched.push(key);
      return hasFallback ? new Response("offline page") : undefined;
    }
  };
  vm.runInNewContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), {
    URL, Response,
    Request: class extends Request {
      constructor(path, options) { super(new URL(path, "https://app.example.test"), options); }
    },
    self: {
      location: { origin: "https://app.example.test" },
      addEventListener: (name, handler) => { handlers[name] = handler; },
      skipWaiting: async () => { calls.skipped = true; },
      clients: { claim: async () => { calls.claimed = true; } }
    },
    caches: {
      open: async () => cache,
      keys: async () => ["prepa-ecg-os-v1", "prepa-ecg-os-v2", "prepa-ecg-os-v3-public-only", "other-app"],
      delete: async (name) => { calls.deleted.push(name); }
    },
    fetch: async () => { if (offline) throw new Error("offline"); return new Response("private page"); }
  });
  function dispatch(name, request) {
    let promise;
    handlers[name]({ request, waitUntil: (p) => { promise = p; }, respondWith: (p) => { promise = p; } });
    return promise;
  }
  return { calls, dispatch };
}

test("worker caches only the public offline page and purges previous private caches", async () => {
  const { calls, dispatch } = createWorker();
  await dispatch("install");
  assert.deepEqual(calls.added, ["/offline.html"]);
  assert.equal(calls.skipped, true);
  await dispatch("activate");
  assert.deepEqual(calls.deleted, ["prepa-ecg-os-v1", "prepa-ecg-os-v2"]);
  assert.equal(calls.claimed, true);
});

test("worker does not intercept API, RSC, uploads, other origins, or POST requests", () => {
  const { dispatch } = createWorker();
  for (const request of [
    { method: "GET", mode: "cors", url: "https://app.example.test/api/health" },
    { method: "GET", mode: "cors", url: "https://app.example.test/dashboard?_rsc=123" },
    { method: "GET", mode: "cors", url: "https://app.example.test/uploads/private.pdf" },
    { method: "GET", mode: "navigate", url: "https://storage.example.test/private.pdf" },
    { method: "POST", mode: "navigate", url: "https://app.example.test/planning" }
  ]) assert.equal(dispatch("fetch", request), undefined);
});

test("private navigations stay online-only; offline never serves a previous account's page", async () => {
  const request = { method: "GET", mode: "navigate", url: "https://app.example.test/dashboard" };
  const online = createWorker();
  assert.equal(await (await online.dispatch("fetch", request)).text(), "private page");
  assert.deepEqual(online.calls.matched, []);
  const offline = createWorker({ offline: true });
  assert.equal(await (await offline.dispatch("fetch", request)).text(), "offline page");
  assert.deepEqual(offline.calls.matched, ["/offline.html"]);
  const missing = createWorker({ offline: true, hasFallback: false });
  const response = await missing.dispatch("fetch", request);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});
