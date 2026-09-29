import pg from "pg";

import { loadMergedEnv } from "./load-env-files.mjs";

if (!process.argv.includes("--confirm-production")) {
  console.error("Ajoute --confirm-production pour autoriser la creation puis la suppression du compte de recette.");
  process.exit(1);
}

const env = {
  ...loadMergedEnv([".env", ".env.local", ".env.production", ".env.production.local"]),
  ...process.env
};
const baseUrl = (process.env.PILOT_URL || env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
const connectionString = (env.DIRECT_URL || env.DATABASE_URL || "").trim();

if (env.APP_MODE !== "production" || !baseUrl.startsWith("https://") || !/^postgres(?:ql)?:\/\//.test(connectionString)) {
  console.error("La recette exige la configuration HTTPS et PostgreSQL de production.");
  process.exit(1);
}

const database = new pg.Client({
  connectionString,
  ssl: connectionString.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 15_000,
  statement_timeout: 60_000
});
const email = `pilot-smoke-${Date.now()}@prepaos.invalid`;
const password = `Pilot-${crypto.randomUUID()}-9a`;
let databaseConnected = false;

function findActionId(html, buttonLabel) {
  const forms = [...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/gi)];
  const form = forms.find((match) => match[1].includes(buttonLabel));
  return form?.[1].match(/name="(\$ACTION_ID_[^"]+)"/)?.[1] ?? "";
}

function authCookie(response) {
  const setCookie = response.headers.get("set-cookie") || "";
  return setCookie.match(/(?:^|,\s*)(prepa_auth=[^;]+)/)?.[1] ?? "";
}

async function getPage(path, cookie = "") {
  return fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      "User-Agent": "PrepaECG-Production-Smoke/1.0"
    },
    signal: AbortSignal.timeout(15_000)
  });
}

async function postForm(path, data, cookie = "") {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    body: data,
    redirect: "manual",
    headers: {
      Origin: baseUrl,
      ...(cookie ? { Cookie: cookie } : {}),
      "User-Agent": "PrepaECG-Production-Smoke/1.0"
    },
    signal: AbortSignal.timeout(20_000)
  });
}

try {
  await database.connect();
  databaseConnected = true;
  const prepResult = await database.query(`SELECT "id", "accessCode" FROM "Class" ORDER BY "createdAt" ASC LIMIT 1`);
  const prep = prepResult.rows[0];
  if (!prep?.accessCode) throw new Error("Aucun etablissement n'est configure pour la recette.");

  const signupPage = await getPage("/signup");
  if (!signupPage.ok) throw new Error(`La page d'inscription renvoie HTTP ${signupPage.status}.`);
  const signupAction = findActionId(await signupPage.text(), "Creer mon compte");
  if (!signupAction) throw new Error("Le formulaire d'inscription est introuvable.");

  const signup = new FormData();
  signup.set(signupAction, "");
  signup.set("firstName", "Recette");
  signup.set("lastName", "Pilote");
  signup.set("email", email);
  signup.set("password", password);
  signup.set("role", "student");
  signup.set("accessCode", prep.accessCode);
  signup.set("invitationToken", "");
  const signupResponse = await postForm("/signup", signup);
  if (signupResponse.status !== 303 || signupResponse.headers.get("location") !== "/onboarding") {
    throw new Error(`Inscription refusee: HTTP ${signupResponse.status}, destination ${signupResponse.headers.get("location") || "absente"}.`);
  }
  const cookie = authCookie(signupResponse);
  if (!cookie) throw new Error("La session n'a pas ete creee apres l'inscription.");

  const onboardingPage = await getPage("/onboarding", cookie);
  if (!onboardingPage.ok) throw new Error(`La configuration renvoie HTTP ${onboardingPage.status}.`);
  const onboardingAction = findActionId(await onboardingPage.text(), "Enregistrer la configuration");
  if (!onboardingAction) throw new Error("Le formulaire de configuration est introuvable.");
  const onboarding = new FormData();
  onboarding.set(onboardingAction, "");
  for (const [key, value] of Object.entries({
    firstName: "Recette", lastName: "Pilote", classId: prep.id, prepYear: "1", lv2Language: "ESPAGNOL",
    weekdayDailyHours: "3", weekendDailyHours: "5", weekdayStart: "18:00", weekdayEnd: "21:30",
    weekendStart: "09:30", weekendEnd: "14:30", sessionBlockMinutes: "50", shortBreakMinutes: "10",
    longBreakMinutes: "25", breakEveryBlocks: "2", energyLevel: "modere", assessmentMaths: "10",
    assessmentEsh: "11", assessmentHgg: "10", assessmentCg: "12", assessmentAng: "13"
  })) onboarding.set(key, value);
  onboarding.append("bceSchools", "HEC");
  const onboardingResponse = await postForm("/onboarding", onboarding, cookie);
  if (onboardingResponse.status !== 303 || onboardingResponse.headers.get("location") !== "/dashboard") {
    throw new Error(`Configuration refusee: HTTP ${onboardingResponse.status}.`);
  }

  for (const route of ["/dashboard", "/planning", "/flashcards", "/resources", "/essays", "/assistant", "/actualites", "/progress", "/onboarding"]) {
    const response = await getPage(route, cookie);
    if (!response.ok) throw new Error(`${route} renvoie HTTP ${response.status}.`);
    const html = await response.text();
    if (html.includes("Se connecter avec ton compte")) throw new Error(`${route} a perdu la session utilisateur.`);
  }

  const dashboardPage = await getPage("/dashboard", cookie);
  const logoutAction = findActionId(await dashboardPage.text(), "Se deconnecter");
  if (!logoutAction) throw new Error("Le bouton de deconnexion est introuvable.");
  const logout = new FormData();
  logout.set(logoutAction, "");
  const logoutResponse = await postForm("/dashboard", logout, cookie);
  if (logoutResponse.status !== 303 || logoutResponse.headers.get("location") !== "/login") {
    throw new Error("La deconnexion n'a pas abouti.");
  }

  const loginPage = await getPage("/login");
  const loginAction = findActionId(await loginPage.text(), "Se connecter");
  if (!loginAction) throw new Error("Le formulaire de connexion est introuvable.");
  const login = new FormData();
  login.set(loginAction, "");
  login.set("email", email);
  login.set("password", password);
  const loginResponse = await postForm("/login", login);
  const adminCookie = authCookie(loginResponse);
  if (loginResponse.status !== 303 || loginResponse.headers.get("location") !== "/dashboard" || !adminCookie) {
    throw new Error("La reconnexion du compte de recette a echoue.");
  }

  await database.query(`UPDATE "User" SET "role" = 'ADMIN', "updatedAt" = NOW() WHERE "email" = $1`, [email]);
  for (const route of ["/admin", "/admin/users", "/admin/establishments", "/admin/activity", "/admin/system"]) {
    const response = await getPage(route, adminCookie);
    if (!response.ok) throw new Error(`${route} renvoie HTTP ${response.status}.`);
    const html = await response.text();
    if (!html.includes("Administration")) throw new Error(`${route} n'affiche pas l'espace administrateur.`);
  }

  console.log("Recette production reussie : parcours eleve, reconnexion et cinq pages administrateur.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Recette production impossible.");
  process.exitCode = 1;
} finally {
  if (databaseConnected) {
    await database.query(`DELETE FROM "AuthEvent" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "email" = $1)`, [email]).catch(() => undefined);
    await database.query(`DELETE FROM "User" WHERE "email" = $1`, [email]).catch(() => undefined);
  }
  await database.end().catch(() => undefined);
}
