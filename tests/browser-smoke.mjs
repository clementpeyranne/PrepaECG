import { chromium, expect } from "@playwright/test";

// Use only the disposable database retained by PREPA_KEEP_TEST_FIXTURE=1.
const base = process.env.PREPA_TEST_URL || "http://localhost:3107";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local test server required");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1365, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const login = async (email, password) => {
  await page.goto(`${base}/login`);
  await page.locator('[name="email"]').fill(email);
  await page.locator('[name="password"]').fill(password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
};
try {
  await page.goto(`${base}/signup`);
  await page.locator('[name="firstName"]').fill("Test");
  await page.locator('[name="lastName"]').fill("Browser");
  await page.locator('[name="email"]').fill("browser-uninvited@example.test");
  await page.locator('[name="password"]').fill("test-password-123");
  await page.locator('[name="role"]').selectOption("teacher");
  await page.locator('[name="accessCode"]').fill("PREPA-A");
  await page.locator('[name="legalAccepted"]').check();
  await page.getByRole("button", { name: "Créer un compte" }).click();
  await expect(page.getByText("Une invitation personnelle est nécessaire pour créer un compte professeur.")).toBeVisible();
  console.log("PASS: inscription professeur sans invitation refusee dans l'interface");

  await login("teacher@example.test", "test-password-123");
  await page.goto(`${base}/teacher/resources/new`);
  await page.locator('[name="subjectCode"]').selectOption("HGG");
  await expect(page.locator('[name="chapterId"] option')).toHaveCount(3);
  await expect(page.locator('[name="chapterId"]')).toContainText("Mondialisation");
  const title = `Cours navigateur ${Date.now()}`;
  await page.locator('[name="title"]').fill(title);
  await page.locator('[name="content"]').fill("La croissance est une augmentation durable de la production.");
  await page.getByRole("button", { name: "Publier la ressource" }).click();
  await expect(page.getByText("Ressource publiée dans ta prépa.")).toBeVisible({ timeout: 15000 });
  console.log("PASS: selection matiere/chapitre et publication avec confirmation");
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/login/);

  await login("student@example.test", "new-password-123");
  await page.goto(`${base}/resources`);
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await page.getByText(title, { exact: true }).click();
  await expect(page.getByText("La croissance est une augmentation durable de la production.", { exact: true }).first()).toBeVisible();
  console.log("PASS: cours du professeur lu par son eleve");

  await page.goto(`${base}/flashcards`);
  await expect(page.getByRole("heading", { name: "Flashcards", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await login("student-b@example.test", "test-password-123");
  await page.goto(`${base}/resources`);
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  console.log("PASS: cours absent pour un eleve d'une autre prepa");
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await page.goto(`${base}/forgot-password`);
  await expect(page.getByText("La réinitialisation automatique par email n'est pas encore disponible.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Recevoir le lien par email" })).toHaveCount(0);
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("PASS: interface honnête sans fournisseur email, aucune erreur JavaScript");
} catch (error) {
  console.error("Failed at:", page.url(), "Browser errors:", errors);
  throw error;
} finally {
  await browser.close();
}
