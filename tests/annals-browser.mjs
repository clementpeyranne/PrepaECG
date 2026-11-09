import { chromium, expect } from "@playwright/test";

// Only the disposable database retained by PREPA_KEEP_TEST_FIXTURE=1.
const base = process.env.PREPA_TEST_URL || "http://localhost:3107";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local test server required");
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/annales`);
  await expect(page).toHaveURL(/\/login/);
  await page.locator('[name="email"]').fill("student@example.test");
  await page.locator('[name="password"]').fill("new-password-123");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.getByRole("link", { name: "Annales de maths", exact: true }).first().click();
  const results = page.getByRole("region", { name: "Sujets et corrigés" });
  await expect(results.getByRole("listitem")).toHaveCount(12);
  await expect(page.getByRole("button", { name: "Précédent", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Suivant", exact: true }).click();
  await expect(page.getByRole("button", { name: "Précédent", exact: true })).toBeEnabled();
  await page.getByRole("group", { name: "Concours et écoles" }).getByRole("button", { name: /^EDHEC / }).click();
  await page.getByLabel("Année", { exact: true }).selectOption("2000");
  await expect(results.getByRole("listitem")).toHaveCount(1);
  await expect(results.getByText("Archive ECE", { exact: false })).toBeVisible();
  await expect(results.getByRole("link", { name: /^Sujet/ })).toHaveAttribute("href", /Sujet-Maths-E-EDHEC-2000\.pdf/);
  await page.getByRole("button", { name: "Maths approfondies", exact: true }).click();
  await expect(results.getByText("Archive ECS", { exact: false })).toBeVisible();
  await expect(results.getByRole("link", { name: /^Sujet/ })).toHaveAttribute("href", /Sujet-Maths-S-EDHEC-2000\.pdf/);
  for (const link of await results.getByRole("link").all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  }
  await page.getByRole("searchbox").fill("aucun-sujet");
  await expect(page.getByText("Aucun sujet ne correspond à ces filtres.")).toBeVisible();
  await page.getByRole("button", { name: "Afficher tous les sujets", exact: true }).click();
  await expect(results.getByRole("listitem")).toHaveCount(12);
  await page.getByLabel("Avec un corrigé disponible").check();
  await expect(results.getByText("Corrigé indisponible")).toHaveCount(0);
  for (const width of [390, 320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  }
  await page.screenshot({ path: "/tmp/prepatempo-annales-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/tmp/prepatempo-annales-mobile.png" });
  await results.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/tmp/prepatempo-annales-mobile-results.png" });
  expect(errors).toEqual([]);
  console.log("PASS: acces protege, navigation, pagination, filieres, filtres, liens et mobile (320/390px)");
} finally {
  await browser.close();
}
