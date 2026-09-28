import { chromium, expect } from "@playwright/test";

// Run against the disposable fixture from PREPA_KEEP_TEST_FIXTURE=1 only.
const base = process.env.PREPA_TEST_URL || "http://localhost:3107";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local test server required");
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
  await page.goto(`${base}/planning`);
  await expect(page.getByRole("button", { name: "Semaine", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /^Afficher / })).toHaveCount(7);
  await expect(page.getByText("Blocs de la journee", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Jour", exact: true }).click();
  await expect(page.getByRole("group", { name: "Choisir une journee" }).getByRole("button")).toHaveCount(7);
  const selectedDay = page.getByRole("group", { name: "Choisir une journee" }).locator('[aria-pressed="true"]');
  const dayLabel = await selectedDay.textContent();
  const validate = page.getByRole("button", { name: "Valider", exact: true }).first();
  await expect(page.getByRole("link", { name: "Deposer une copie", exact: true }).first()).toBeVisible();
  await validate.click();
  await expect(page.getByText("Attention : copie non deposee.", { exact: true }).first()).toBeVisible();
  const validateAnyway = page.getByRole("button", { name: /^Valider quand meme / }).first();
  const forcedLabel = await validateAnyway.getAttribute("aria-label");
  await validateAnyway.click();
  const title = forcedLabel.replace(/^Valider quand meme /, "");
  const label = `Valider ${title}`;
  const undoLabel = `Annuler la validation de ${title}`;
  await expect(page.getByRole("button", { name: undoLabel, exact: true })).toBeVisible();
  await expect(selectedDay).toHaveText(dayLabel);
  await page.reload();
  await page.getByRole("button", { name: "Jour", exact: true }).click();
  await expect(page.getByRole("button", { name: undoLabel, exact: true })).toBeVisible();
  await page.getByRole("button", { name: undoLabel, exact: true }).click();
  await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  }
  await page.getByRole("button", { name: "Semaine", exact: true }).click();
  await page.getByRole("button", { name: /^Afficher / }).last().click();
  await expect(page.getByRole("button", { name: "Jour", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Jour suivant", exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
  console.log("PASS: semaine/jour, avertissement copie, validation, rechargement, annulation et largeur mobile");
} finally {
  await browser.close();
}
