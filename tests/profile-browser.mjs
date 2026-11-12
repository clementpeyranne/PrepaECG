import { chromium, expect } from "@playwright/test";

const base = process.env.PREPA_TEST_URL || "http://localhost:3107";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local fixture server required");
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/login`);
  await page.locator('[name="email"]').fill("student@example.test");
  await page.locator('[name="password"]').fill("new-password-123");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto(`${base}/onboarding`);
  await expect(page.getByRole("heading", { name: "Profil", exact: true })).toBeVisible();
  await expect(page.locator('[name="humanities"]')).toHaveValue("HGG");
  await expect(page.locator('[name="mathsOption"]')).toHaveValue("APPROFONDIES");
  await expect(page.locator('[name="lv2Language"]')).toHaveValue("ALLEMAND");
  await expect(page.locator('[name="weekdayStart"]')).toHaveValue("17:30");
  await expect(page.locator('[name="assessmentAll"]')).toHaveValue("12");
  await expect(page.locator('[name^="assessment"]')).toHaveCount(5);
  await page.locator('[name="humanities"]').selectOption("ESH");
  await page.locator('[name="mathsOption"]').selectOption("APPLIQUEES");
  await page.locator('[name="lv2Language"]').selectOption("ITALIEN");
  await expect(page.locator('[name="assessmentHgg"]')).toHaveCount(0);
  await expect(page.locator('[name="assessmentAll"]')).toHaveCount(0);
  await page.locator('[name="assessmentIta"]').fill("11.5");
  await page.locator('[name="weekdayStart"]').fill("17:45");
  await page.getByRole("button", { name: "Enregistrer le profil", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.goto(`${base}/onboarding`);
  await expect(page.locator('[name="humanities"]')).toHaveValue("ESH");
  await expect(page.locator('[name="mathsOption"]')).toHaveValue("APPLIQUEES");
  await expect(page.locator('[name="lv2Language"]')).toHaveValue("ITALIEN");
  await expect(page.locator('[name="assessmentIta"]')).toHaveValue("11.5");
  await expect(page.locator('[name="weekdayStart"]')).toHaveValue("17:45");
  await expect(page.locator('[name="bceSchools"][value="EDHEC"]')).toBeChecked();
  await page.locator('[name="lv2Language"]').selectOption("ALLEMAND");
  await expect(page.locator('[name="assessmentAll"]')).toHaveValue("12");
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
  await page.screenshot({ path: "/tmp/prepatempo-profil-mobile.png" });
  await page.goto(`${base}/planning`);
  await expect(page.getByRole("heading", { name: "Planning", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Modifier le profil", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  console.log("PASS: cinq matieres, changements de parcours/langue, persistance des horaires/notes/objectifs, historique, planning et mobile");
} finally {
  await browser.close();
}
