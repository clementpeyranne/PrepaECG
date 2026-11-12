import { chromium, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

// Run against the disposable fixture from PREPA_KEEP_TEST_FIXTURE=1 only.
const base = process.env.PREPA_TEST_URL || "http://localhost:3107";
const databaseUrl = process.env.PREPA_TEST_DATABASE || "";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname) || !/^file:\/.*\/prepa-journeys-[^/]+\/test.db$/.test(databaseUrl)) throw new Error("Disposable local test database required");
const db = new PrismaClient({ datasourceUrl: databaseUrl });
const sessionId = `planning-browser-${crypto.randomUUID()}`;
const taskTitle = "Rédiger une démonstration (test navigateur)";
let browser;
try {
  const student = await db.user.findUniqueOrThrow({ where: { email: "student@example.test" } });
  const maths = await db.subject.findUniqueOrThrow({ where: { code: "MATHS" } });
  const plannedStartAt = new Date();
  plannedStartAt.setHours(17, 0, 0, 0);
  await db.studySession.create({ data: {
    id: sessionId, studentId: student.id, subjectId: maths.id, plannedStartAt,
    plannedDurationMin: 30, sessionType: "EXERCISE_TRAINING", goalText: taskTitle,
    status: "PLANNED", createdByType: "USER"
  } });
  browser = await chromium.launch({ channel: "chrome", headless: true });
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
  const block = page.getByText(taskTitle, { exact: true }).locator("../..");
  const validate = block.getByRole("button", { name: "Valider", exact: true });
  await expect(block.getByRole("link", { name: "Déposer une copie", exact: true })).toBeVisible();
  await validate.click();
  await expect(block.getByText("Attention : copie non déposée.", { exact: true })).toBeVisible();
  const validateAnyway = block.getByRole("button", { name: /^Valider quand même / });
  const forcedLabel = await validateAnyway.getAttribute("aria-label");
  await validateAnyway.click();
  const title = forcedLabel.replace(/^Valider quand même /, "");
  const undoLabel = `Annuler la validation de ${title}`;
  await expect(page.getByRole("button", { name: undoLabel, exact: true })).toBeVisible();
  await expect(selectedDay).toHaveText(dayLabel);
  await page.reload();
  await page.getByRole("button", { name: "Jour", exact: true }).click();
  await expect(page.getByRole("button", { name: undoLabel, exact: true })).toBeVisible();
  await page.getByRole("button", { name: undoLabel, exact: true }).click();
  await expect(validate).toBeVisible();

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(validate).toBeVisible();
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
  if (browser) await browser.close();
  await db.studySession.deleteMany({ where: { id: sessionId } });
  await db.$disconnect();
}
